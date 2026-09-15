// Referral partner program: 20% of a referred shop's payments for the 12
// months after its first payment, tracked per payment and paid out by hand
// (PayPal) from the admin page.
//
//   partner shares  https://brewstamp.app/?ref=CODE
//   → proxy.ts sets a 90-day `bs_ref` cookie
//   → register / OAuth createUser stamps User.referredBy
//   → every Payment write calls recordReferralEarning()

import { randomBytes } from "node:crypto";
import { connectDB } from "./mongoose";
import { Payment, ReferralEarning, Shop, User } from "../models";

export const REFERRAL_RATE_PERCENT = 20;
export const REFERRAL_MONTHS = 12;
export const REF_COOKIE = "bs_ref";
// An earning is only payable once its payment is old enough that a chargeback
// is unlikely (card networks allow ~120 days; nearly all disputes on small
// subscriptions land inside 60). Newer earnings show as "pending".
export const MATURITY_DAYS = 60;
export const PAYOUT_MIN_CENTS = 2500;

export const matured = (earnedAt: Date | string, now = new Date()) =>
  now.getTime() - new Date(earnedAt).getTime() >= MATURITY_DAYS * 86_400_000;

// Short, unambiguous, upper-case: BRW-7K3M9Q.
export function newReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function referralLink(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";
  return `${base}/?ref=${code}`;
}

// Resolve a referral code to the partner's user id (null if unknown or not
// a partner). The request-side cookie read lives in referral-cookie.ts so
// this module stays importable from the cron (no next/headers here).
export async function partnerIdForCode(code: string | undefined | null): Promise<string | null> {
  const c = code?.toUpperCase();
  if (!c || !/^[A-Z0-9]{4,12}$/.test(c)) return null;
  await connectDB();
  const partner = await User.findOne({ referralCode: c, referralPartner: true }).select("_id").lean<any>();
  return partner ? String(partner._id) : null;
}

// Make (or return) a user's referral code and mark them a partner.
export async function enrolPartner(userId: string, payoutEmail?: string) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new Error("user not found");
  if (!user.referralCode) {
    for (let i = 0; i < 5; i++) {
      const code = newReferralCode();
      if (!(await User.exists({ referralCode: code }))) { user.referralCode = code; break; }
    }
  }
  if (!user.referralPartner) {
    user.referralPartner = true;
    user.referralPartnerSince = new Date();
  }
  if (payoutEmail) user.referralPayoutEmail = payoutEmail;
  await user.save();
  return user;
}

// Credit the partner for a paid Payment row, if the shop's owner was
// referred and the payment falls inside the commission window. Idempotent
// on payment id. Safe to call for every payment — most return null.
export async function recordReferralEarning(paymentId: unknown) {
  await connectDB();
  const payment = await Payment.findById(paymentId).lean<any>();
  if (!payment || payment.status !== "paid" || payment.amountCents <= 0) return null;
  const shop = await Shop.findById(payment.shop).select("owner").lean<any>();
  if (!shop) return null;
  const owner = await User.findById(shop.owner).select("referredBy").lean<any>();
  if (!owner?.referredBy) return null;
  const partner = await User.findById(owner.referredBy).select("referralPartner").lean<any>();
  if (!partner?.referralPartner) return null;

  // 12-month window from the referred owner's first ever paid payment,
  // across all their shops.
  const ownerShops = await Shop.find({ owner: shop.owner }).select("_id").lean<any>();
  const first = await Payment.findOne({ shop: { $in: ownerShops.map((s: any) => s._id) }, status: "paid", amountCents: { $gt: 0 } })
    .sort({ paidAt: 1, createdAt: 1 })
    .select("paidAt createdAt")
    .lean<any>();
  const firstAt = new Date(first?.paidAt ?? first?.createdAt ?? payment.paidAt ?? payment.createdAt);
  const windowEnd = new Date(firstAt);
  windowEnd.setUTCMonth(windowEnd.getUTCMonth() + REFERRAL_MONTHS);
  const paidAt = new Date(payment.paidAt ?? payment.createdAt);
  if (paidAt >= windowEnd) return null;

  const amountCents = Math.round((payment.amountCents * REFERRAL_RATE_PERCENT) / 100);
  if (amountCents <= 0) return null;
  try {
    return await ReferralEarning.findOneAndUpdate(
      { payment: payment._id },
      {
        $setOnInsert: {
          partner: owner.referredBy,
          referredUser: shop.owner,
          shop: payment.shop,
          payment: payment._id,
          paymentAmountCents: payment.amountCents,
          currency: payment.currency,
          ratePercent: REFERRAL_RATE_PERCENT,
          amountCents,
          earnedAt: paidAt,
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("[referrals] earning write failed:", err);
    return null;
  }
}

// A payment was refunded or disputed: void its earning. Called by the
// billing webhooks. If it had already been paid out, the amount becomes a
// clawback netted against the partner's next payout.
export async function reverseReferralEarning(paymentId: unknown, reason: string) {
  await connectDB();
  const e = await ReferralEarning.findOne({ payment: paymentId });
  if (!e || e.reversedAt) return null;
  e.reversedAt = new Date();
  e.reversalReason = reason;
  await e.save();
  return e;
}

// Buckets for a set of earnings: payable (matured, not reversed, not paid),
// pending (too new), paid (already paid, not reversed), clawback (paid, then
// reversed — owed back to us).
export function bucketEarnings(earnings: any[], now = new Date()) {
  const add = (m: Record<string, number>, cur: string, cents: number) => { m[cur] = (m[cur] ?? 0) + cents; };
  const payable: Record<string, number> = {}, pending: Record<string, number> = {}, paid: Record<string, number> = {}, clawback: Record<string, number> = {};
  for (const e of earnings) {
    if (e.reversedAt) { if (e.paidOutAt && !e.clawbackSettledAt) add(clawback, e.currency, e.amountCents); continue; }
    if (e.paidOutAt) add(paid, e.currency, e.amountCents);
    else if (matured(e.earnedAt, now)) add(payable, e.currency, e.amountCents);
    else add(pending, e.currency, e.amountCents);
  }
  // Net = payable − clawback, per currency (what a payout would actually be).
  const net: Record<string, number> = { ...payable };
  for (const [c, v] of Object.entries(clawback)) net[c] = (net[c] ?? 0) - v;
  return { payable, pending, paid, clawback, net };
}

// Partner-facing summary: referred shops and earnings, owed vs paid.
export async function partnerSummary(partnerId: string) {
  await connectDB();
  const referred = await User.find({ referredBy: partnerId }).select("email name createdAt").lean<any>();
  const referredIds = referred.map((u: any) => u._id);
  const shops = await Shop.find({ owner: { $in: referredIds } }).select("name owner createdAt").lean<any>();
  const earnings = await ReferralEarning.find({ partner: partnerId }).sort({ earnedAt: -1 }).lean<any>();
  const { payable, pending, paid, clawback, net } = bucketEarnings(earnings);
  const byShop = new Map<string, { earnedCents: number; currency: string; payments: number }>();
  for (const e of earnings) {
    if (e.reversedAt) continue;
    const k = String(e.shop);
    const cur = byShop.get(k) ?? { earnedCents: 0, currency: e.currency, payments: 0 };
    cur.earnedCents += e.amountCents; cur.payments += 1; byShop.set(k, cur);
  }
  return {
    referredUsers: referred.length,
    shops: shops.map((s: any) => {
      const u = referred.find((r: any) => String(r._id) === String(s.owner));
      const stats = byShop.get(String(s._id));
      return {
        id: String(s._id),
        name: s.name,
        ownerEmailMasked: u ? u.email.replace(/^(.{2}).*(@.*)$/, "$1…$2") : "",
        signedUpAt: s.createdAt,
        paying: !!stats,
        payments: stats?.payments ?? 0,
        earnedCents: stats?.earnedCents ?? 0,
        currency: stats?.currency ?? "usd",
      };
    }),
    // "owed" = payable now (matured, net of any clawbacks); "pending" is
    // earned but inside the chargeback window.
    owed: net,
    pending,
    paid,
    clawback,
    earnings: earnings.map((e: any) => ({
      id: String(e._id),
      shop: String(e.shop),
      earnedAt: e.earnedAt,
      paymentAmountCents: e.paymentAmountCents,
      amountCents: e.amountCents,
      currency: e.currency,
      paidOutAt: e.paidOutAt ?? null,
      reversedAt: e.reversedAt ?? null,
      matured: matured(e.earnedAt),
    })),
  };
}
