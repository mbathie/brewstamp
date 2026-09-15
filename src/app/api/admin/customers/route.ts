import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongoose";
import { Payment, Shop, Subscription, User } from "@/models";
import { resolveSub, subscriptionTier } from "@/lib/plans";
import { stripeAmount } from "@/lib/paypal-billing";
import { stampyCollections } from "@/lib/stampy-db";

export const dynamic = "force-dynamic";

// Paying customers: every real subscription (any provider, any status)
// joined with its shop, owner and billing totals from the `payments` ledger.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();

  const subs = (await Subscription.find({
    $or: [{ stripeSubscriptionId: { $exists: false } }, { stripeSubscriptionId: { $not: /^sub_seed_/ } }],
  }).lean()) as any[];

  const shopIds = subs.map((s) => s.shop);
  const shops = (await Shop.find({ _id: { $in: shopIds } }).select("name owner").lean()) as any[];
  const shopById = new Map(shops.map((s) => [String(s._id), s]));
  const owners = (await User.find({ _id: { $in: shops.map((s) => s.owner) } }).select("email name").lean()) as any[];
  const ownerById = new Map(owners.map((u) => [String(u._id), u]));

  // Billing totals per shop from the ledger.
  const agg = await Payment.aggregate([
    { $match: { shop: { $in: shopIds } } },
    {
      $group: {
        _id: "$shop",
        paidCount: { $sum: { $cond: [{ $in: ["$status", ["paid", "refunded", "disputed"]] }, 1, 0] } },
        failedCount: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        refundedCents: { $sum: "$refundedCents" },
        totals: {
          $push: {
            $cond: [
              { $in: ["$status", ["paid", "refunded", "disputed"]] },
              { currency: "$currency", cents: "$amountCents" },
              "$$REMOVE",
            ],
          },
        },
        firstPaidAt: { $min: { $cond: [{ $in: ["$status", ["paid", "refunded", "disputed"]] }, { $ifNull: ["$paidAt", "$createdAt"] }, null] } },
        lastPaidAt: { $max: { $cond: [{ $in: ["$status", ["paid", "refunded", "disputed"]] }, { $ifNull: ["$paidAt", "$createdAt"] }, null] } },
      },
    },
  ]);
  const billing = new Map(agg.map((a: any) => [String(a._id), a]));

  const rows = subs.map((s) => {
    const shop = shopById.get(String(s.shop));
    const owner = shop ? ownerById.get(String(shop.owner)) : null;
    const b = billing.get(String(s.shop));
    const totalPaid: Record<string, number> = {};
    for (const t of b?.totals ?? []) totalPaid[t.currency] = (totalPaid[t.currency] ?? 0) + t.cents;
    const tier = resolveSub(s);
    const interval = subscriptionTier(s)?.interval ?? s.interval ?? "month";
    const live = ["active", "past_due"].includes(s.status);
    // Exact stored price/currency when backfilled; otherwise derived from the
    // Stripe price id (AUD legacy tiers included) rather than assuming USD.
    const amt = stripeAmount(s);
    const priceCents = s.priceCents ?? amt.amountCents;
    const currency = (s.currency ?? amt.currency).toLowerCase();
    return {
      shopId: String(s.shop),
      legacy: null,
      shopName: shop?.name ?? "(deleted shop)",
      ownerEmail: owner?.email ?? "?",
      ownerName: owner?.name ?? "",
      provider: s.provider ?? "stripe",
      status: s.status,
      cancelAtPeriodEnd: !!s.cancelAtPeriodEnd,
      planSlug: tier.slug,
      planLabel: tier.label + (tier.legacy ? " (legacy)" : ""),
      interval,
      priceCents,
      currency,
      monthlyCents: interval === "year" ? Math.round(priceCents / 12) : priceCents,
      startedAt: b?.firstPaidAt ?? s.createdAt,
      lastPaidAt: b?.lastPaidAt ?? null,
      nextBillAt: live && !s.cancelAtPeriodEnd ? s.currentPeriodEnd ?? null : null,
      endsAt: live && s.cancelAtPeriodEnd ? s.currentPeriodEnd ?? null : null,
      timesBilled: b?.paidCount ?? 0,
      failedCharges: b?.failedCount ?? 0,
      totalPaid,
      refundedCents: b?.refundedCents ?? 0,
      card: s.card?.last4 ? s.card : null,
      migration: s.migratedAt ? "migrated" : s.migrationEmailedAt ? "awaiting_card" : s.provider === "paypal" ? "n/a" : "not_sent",
      migrationEmailedAt: s.migrationEmailedAt ?? null,
      migratedAt: s.migratedAt ?? null,
      failedAttempts: s.failedAttempts ?? 0,
      nextAttemptAt: s.nextAttemptAt ?? null,
    };
  });

  // Legacy StampyStamp merchants, billed by us from the stampy db. Never let
  // a stampy hiccup blank the Brewstamp list.
  const stampyRows: any[] = [];
  try {
    const { subscriptions, payments } = await stampyCollections();
    const subs = await subscriptions.find({}).toArray();
    const pAgg = await payments.aggregate([
      { $group: {
        _id: "$merchantId",
        paidCount: { $sum: { $cond: [{ $in: ["$status", ["paid", "refunded", "disputed"]] }, 1, 0] } },
        failedCount: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        refundedCents: { $sum: "$refundedCents" },
        totals: { $push: { $cond: [{ $in: ["$status", ["paid", "refunded", "disputed"]] }, { currency: "$currency", cents: "$amountCents" }, "$$REMOVE"] } },
        firstPaidAt: { $min: { $cond: [{ $in: ["$status", ["paid", "refunded", "disputed"]] }, "$paidAt", null] } },
        lastPaidAt: { $max: { $cond: [{ $in: ["$status", ["paid", "refunded", "disputed"]] }, "$paidAt", null] } },
      } },
    ]).toArray();
    const pBy = new Map(pAgg.map((a: any) => [a._id, a]));
    for (const s of subs) {
      const b = pBy.get(s.merchantId);
      const totalPaid: Record<string, number> = {};
      for (const t of b?.totals ?? []) totalPaid[t.currency] = (totalPaid[t.currency] ?? 0) + t.cents;
      const live = ["active", "past_due"].includes(s.status);
      stampyRows.push({
        shopId: null,
        legacy: "stampystamp",
        shopName: s.merchantName,
        ownerEmail: s.merchantEmail,
        ownerName: "",
        provider: s.provider,
        status: s.status,
        cancelAtPeriodEnd: !!s.cancelAtPeriodEnd,
        planSlug: "stampy",
        planLabel: `StampyStamp ${s.planLabel}`,
        interval: s.interval,
        priceCents: s.priceCents,
        currency: s.currency,
        monthlyCents: s.interval === "year" ? Math.round(s.priceCents / 12) : s.priceCents,
        startedAt: b?.firstPaidAt ?? s.createdAt,
        lastPaidAt: b?.lastPaidAt ?? null,
        nextBillAt: live && !s.cancelAtPeriodEnd ? s.currentPeriodEnd ?? null : null,
        endsAt: live && s.cancelAtPeriodEnd ? s.currentPeriodEnd ?? null : null,
        timesBilled: b?.paidCount ?? 0,
        failedCharges: b?.failedCount ?? 0,
        totalPaid,
        refundedCents: b?.refundedCents ?? 0,
        card: s.card?.last4 ? s.card : null,
        migration: s.migratedAt ? "migrated" : s.migrationEmailedAt ? "awaiting_card" : s.provider === "paypal" ? "n/a" : "not_sent",
        migrationEmailedAt: s.migrationEmailedAt ?? null,
        migratedAt: s.migratedAt ?? null,
        failedAttempts: s.failedAttempts ?? 0,
        nextAttemptAt: s.nextAttemptAt ?? null,
      });
    }
  } catch (err) {
    console.error("[admin/customers] stampy rows failed:", err);
  }

  const all = [...rows, ...stampyRows];
  all.sort((a, b) => (b.nextBillAt ? new Date(b.nextBillAt).getTime() : 0) - (a.nextBillAt ? new Date(a.nextBillAt).getTime() : 0));
  return NextResponse.json({ customers: all, generatedAt: new Date().toISOString() });
}
