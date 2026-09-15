import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongoose";
import { ReferralEarning, Shop, User } from "@/models";
import { bucketEarnings, matured, PAYOUT_MIN_CENTS } from "@/lib/referrals";

export const dynamic = "force-dynamic";

// Every partner with referred signups, paying shops, owed and paid totals.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const partners = await User.find({ referralPartner: true }).select("email name referralCode referralPayoutEmail referralPartnerSince").lean<any>();
  const ids = partners.map((p: any) => p._id);
  const referred = await User.find({ referredBy: { $in: ids } }).select("referredBy email createdAt").lean<any>();
  const referredIds = referred.map((u: any) => u._id);
  const shops = await Shop.find({ owner: { $in: referredIds } }).select("owner name").lean<any>();
  const earnings = await ReferralEarning.find({ partner: { $in: ids } }).lean<any>();

  const rows = partners.map((p: any) => {
    const mine = referred.filter((u: any) => String(u.referredBy) === String(p._id));
    const mineIds = new Set(mine.map((u: any) => String(u._id)));
    const myShops = shops.filter((s: any) => mineIds.has(String(s.owner)));
    const mineEarnings = earnings.filter((e: any) => String(e.partner) === String(p._id));
    const { net: owed, pending, paid, clawback } = bucketEarnings(mineEarnings);
    const payingShops = new Set<string>(mineEarnings.filter((e: any) => !e.reversedAt).map((e: any) => String(e.shop)));
    return {
      id: String(p._id),
      email: p.email,
      name: p.name,
      code: p.referralCode,
      payoutEmail: p.referralPayoutEmail ?? null,
      since: p.referralPartnerSince ?? null,
      referredSignups: mine.length,
      referredShops: myShops.length,
      payingShops: payingShops.size,
      owed,
      pending,
      paid,
      clawback,
      // Ready to pay when any currency's net balance clears the minimum.
      payable: Object.values(owed).some((v) => v >= PAYOUT_MIN_CENTS),
    };
  });
  const owedTotal = (r: { owed: Record<string, number> }) => Object.values(r.owed).reduce((x, y) => x + y, 0);
  rows.sort((a: { owed: Record<string, number> }, b: { owed: Record<string, number> }) => owedTotal(b) - owedTotal(a));
  return NextResponse.json({ partners: rows });
}

// Mark a partner's MATURED earnings as paid out, and settle any clawbacks
// (reversed earnings that were already paid) against them at the same time.
// Body: { partnerId, note? }
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { partnerId, note } = (await req.json().catch(() => ({}))) as { partnerId?: string; note?: string };
  if (!partnerId) return NextResponse.json({ error: "Missing partnerId" }, { status: 400 });
  const now = new Date();
  const owedRows = await ReferralEarning.find({ partner: partnerId, paidOutAt: null, reversedAt: null }).lean<any>();
  const ids = owedRows.filter((e: any) => matured(e.earnedAt, now)).map((e: any) => e._id);
  const r = await ReferralEarning.updateMany(
    { _id: { $in: ids } },
    { $set: { paidOutAt: now, payoutNote: note ?? "" } }
  );
  // Clawbacks are netted in this payout: record that they've been recovered
  // so they don't keep reducing future balances.
  const c = await ReferralEarning.updateMany(
    { partner: partnerId, reversedAt: { $ne: null }, paidOutAt: { $ne: null }, clawbackSettledAt: null },
    { $set: { clawbackSettledAt: now } }
  );
  return NextResponse.json({ ok: true, marked: r.modifiedCount, clawbacksSettled: c.modifiedCount });
}
