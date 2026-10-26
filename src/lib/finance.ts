import { connectDB } from "@/lib/mongoose";
import { Payment, Shop, Subscription, User } from "@/models";
import type { PlanCatalog } from "@/lib/plans";
import { getPlanCatalog } from "@/lib/plan-catalog";
import type {
  CurrencyMap,
  FinanceSummary,
  MonthRevenue,
  PlanMrr,
} from "@/lib/finance-math";

/**
 * Brewstamp financial aggregation, computed from our own records:
 *   - `subscriptions` → MRR / ARR / active counts / 30-day movement
 *   - `payments`      → revenue (every charge, whichever provider took it)
 *
 * No provider API calls. Stripe history was backfilled into `payments` by
 * scripts/backfill-stripe-payments.ts and is kept current by the invoice
 * webhook; PayPal rows are written by paypal-billing. See
 * docs/revenue-snapshots.md for methodology. Amounts are cents keyed by
 * currency; revenue = amount charged (gross of refunds).
 */

function addCur(m: CurrencyMap, currency: string, cents: number) {
  m[currency] = (m[currency] ?? 0) + cents;
}

const DAY = (d: Date) => d.toISOString().slice(0, 10);

// A Stripe-billed sub's currency isn't always stored on the doc; the plan
// price it's on (AUD for the pre-2026-07-28 prices) says what invoices carry.
function subCurrency(catalog: PlanCatalog, s: any): string {
  if (s.currency) return String(s.currency).toLowerCase();
  return catalog.byPriceId(s.stripePriceId)?.price.currency ?? "usd";
}

export interface MrrSnapshot {
  mrr: CurrencyMap;
  mrrMonthAgo: CurrencyMap;
  mrrMovement: { newSubscriptions: number; churnedSubscriptions: number };
  activeSubscriptions: number;
  activeCustomers: number;
  mrrByPlan: PlanMrr[];
}

/**
 * MRR now and 30 days ago, from subscriptions alone (plus each shop's first
 * payment date). Two queries, no payment rows loaded — cheap enough for the
 * admin shops page, which only needs these headline figures.
 */
export async function getMrrSnapshot(): Promise<MrrSnapshot> {
  await connectDB();
  const catalog = await getPlanCatalog();
  // ---- Subscriptions → MRR (and MRR as it stood a month ago) ----
  const mrr: CurrencyMap = {};
  const mrrMonthAgo: CurrencyMap = {};
  let newSubscriptions = 0;
  let churnedSubscriptions = 0;
  // "A month ago" = 30 days, so the figure is stable day to day rather than
  // jumping at month boundaries.
  const monthAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const planAgg = new Map<string, PlanMrr>();
  let activeSubscriptions = 0;
  const activeShops = new Set<string>();

  // Both queries are independent: run them together.
  const [subs, firstPayments] = (await Promise.all([
    Subscription.find({}).lean(),
    Payment.aggregate([
      { $match: { status: { $ne: "failed" } } },
      { $group: { _id: "$shop", first: { $min: { $ifNull: ["$paidAt", "$createdAt"] } } } },
    ]),
  ])) as [any[], any[]];
  // Seed subs never billed anyone.
  const real = subs.filter((s) => !String(s.stripeSubscriptionId ?? "").startsWith("sub_seed_"));
  // First payment per shop tells us when a sub really started (the doc's
  // createdAt is when the webhook first saw it, which is the same day).
  const firstPaid = new Map<string, number>(
    firstPayments.map((p: any) => [String(p._id), new Date(p.first).getTime()]),
  );

  for (const s of real) {
    const tier = catalog.resolveSub(s);
    const cur = subCurrency(catalog, s);
    // Stored per-sub price (exact, incl. grandfathered) → monthly equivalent;
    // catalogue-derived tier price as the fallback for unbackfilled docs.
    const m =
      s.priceCents != null
        ? s.interval === "year" ? Math.round(s.priceCents / 12) : s.priceCents
        : tier.monthlyCents;
    const live = ["active", "past_due"].includes(s.status);
    const shopKey = String(s.shop);
    const startedMs = firstPaid.get(shopKey) ?? new Date(s.createdAt).getTime();
    const startedBy = startedMs <= monthAgoMs;
    // Ended = when the doc last changed (status flips write updatedAt).
    const endedMs = live ? null : new Date(s.updatedAt).getTime();

    // Was this subscription counting toward MRR a month ago? Either it's still
    // live and had started by then, or it has since ended but was live then.
    const wasLiveMonthAgo = startedBy && (live || (endedMs != null && endedMs > monthAgoMs));
    if (wasLiveMonthAgo) addCur(mrrMonthAgo, cur, m);
    if (live && !startedBy) newSubscriptions += 1;
    if (!live && wasLiveMonthAgo) churnedSubscriptions += 1;

    if (!live) continue;
    activeSubscriptions += 1;
    activeShops.add(shopKey);
    addCur(mrr, cur, m);
    // One row per plan, currency, interval and price actually paid, so a
    // grandfathered US$5 Pro and today's US$12 Pro don't blur together.
    const interval: "month" | "year" = s.interval === "year" ? "year" : "month";
    const priceCents = s.priceCents ?? (interval === "year" ? m * 12 : m);
    const plan = catalog.bySlug(tier.slug);
    const catalogueCents = plan ? catalog.priceCents(plan, interval) : 0;
    const key = `${tier.slug}|${cur}|${interval}|${priceCents}`;
    const existing = planAgg.get(key);
    if (existing) {
      existing.monthlyCents += m;
      existing.subscriptions += 1;
    } else {
      planAgg.set(key, {
        plan: tier.label,
        currency: cur,
        priceCents,
        interval,
        grandfathered: catalogueCents > 0 && priceCents < catalogueCents,
        monthlyCents: m,
        subscriptions: 1,
      });
    }
  }
  return {
    mrr,
    mrrMonthAgo,
    mrrMovement: { newSubscriptions, churnedSubscriptions },
    activeSubscriptions,
    activeCustomers: activeShops.size,
    mrrByPlan: [...planAgg.values()].sort((a, b) => b.monthlyCents - a.monthlyCents),
  };
}

export async function getBrewstampFinance(opts?: {
  from?: Date;
  to?: Date;
}): Promise<FinanceSummary> {
  await connectDB();
  const to = opts?.to ?? new Date();
  const from = opts?.from ?? new Date("2026-01-01T00:00:00Z");
  const catalog = await getPlanCatalog();

  const snap = await getMrrSnapshot();
  const { mrr } = snap;
  const arr: CurrencyMap = {};
  for (const [cur, cents] of Object.entries(mrr)) arr[cur] = cents * 12;

  // ---- Payments → revenue (in-range, by-month, lifetime, recent) ----
  const revenueInRange: CurrencyMap = {};
  const lifetimeRevenue: CurrencyMap = {};
  const byMonth = new Map<string, CurrencyMap>();
  let invoiceCountInRange = 0;
  let lifetimeInvoiceCount = 0;
  let firstPaymentMs: number | null = null;
  const recent: FinanceSummary["recentTransactions"] = [];

  const payments = (await Payment.find({
    status: { $in: ["paid", "refunded", "disputed"] },
    amountCents: { $gt: 0 },
  })
    .sort({ paidAt: -1, createdAt: -1 })
    .lean()) as any[];

  // Owner email per shop, for the recent-transactions list.
  const shopIds = [...new Set(payments.map((p) => String(p.shop)))];
  const shops = (await Shop.find({ _id: { $in: shopIds } }).select("owner").lean()) as any[];
  const owners = (await User.find({ _id: { $in: shops.map((x) => x.owner) } }).select("email").lean()) as any[];
  const emailById = new Map(owners.map((u) => [String(u._id), u.email as string]));
  const ownerEmail = new Map(shops.map((sh) => [String(sh._id), emailById.get(String(sh.owner)) ?? "?"]));
  // Which Stripe account each payment's subscription lives on (missing = the
  // old shared account, as in stripeAccountOf).
  const subIds = [...new Set(payments.filter((p) => p.subscription).map((p) => String(p.subscription)))];
  const subs = (await Subscription.find({ _id: { $in: subIds } }).select("stripeAccount").lean()) as any[];
  const accountBySub = new Map(subs.map((s) => [String(s._id), s.stripeAccount === "main" ? "main" : "legacy"] as const));

  for (const p of payments) {
    const when = new Date(p.paidAt ?? p.createdAt);
    const cur = String(p.currency || "usd").toLowerCase();
    lifetimeInvoiceCount += 1;
    addCur(lifetimeRevenue, cur, p.amountCents);
    firstPaymentMs = firstPaymentMs == null ? when.getTime() : Math.min(firstPaymentMs, when.getTime());

    if (when >= from && when <= to) {
      invoiceCountInRange += 1;
      addCur(revenueInRange, cur, p.amountCents);
      const mk = when.toISOString().slice(0, 7);
      const bucket = byMonth.get(mk) ?? {};
      addCur(bucket, cur, p.amountCents);
      byMonth.set(mk, bucket);
      if (recent.length < 200) {
        // The provider field is set on every row; the processor ids are the
        // fallback for any row written before it existed.
        const provider: "stripe" | "paypal" = p.provider ?? (p.stripeInvoiceId ? "stripe" : "paypal");
        recent.push({
          date: DAY(when),
          email: ownerEmail.get(String(p.shop)) ?? "?",
          plan: `Brewstamp ${catalog.bySlug(p.planSlug)?.label ?? "Pro"}`,
          amountCents: p.amountCents,
          currency: cur,
          provider,
          stripeAccount: provider === "stripe" ? (accountBySub.get(String(p.subscription)) ?? "legacy") : null,
        });
      }
    }
  }
  recent.sort((a, b) => b.date.localeCompare(a.date));

  const revenueByMonth: MonthRevenue[] = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, byCurrency]) => ({ month, byCurrency }));

  return {
    generatedAt: new Date().toISOString(),
    mrr,
    arr,
    mrrMonthAgo: snap.mrrMonthAgo,
    mrrMovement: snap.mrrMovement,
    activeSubscriptions: snap.activeSubscriptions,
    activeCustomers: snap.activeCustomers,
    mrrByPlan: snap.mrrByPlan,
    range: { from: DAY(from), to: DAY(to) },
    revenueInRange,
    revenueByMonth,
    invoiceCountInRange,
    lifetimeRevenue,
    lifetimeInvoiceCount,
    firstPaymentAt: firstPaymentMs ? DAY(new Date(firstPaymentMs)) : null,
    recentTransactions: recent.slice(0, 50),
  };
}
