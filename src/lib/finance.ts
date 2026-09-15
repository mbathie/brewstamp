import { connectDB } from "@/lib/mongoose";
import { Payment, Shop, Subscription, User } from "@/models";
import { getPlanBySlug, resolveSub } from "@/lib/plans";
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

// A Stripe-billed sub's currency isn't stored on the doc; the plan's price
// currency is what the invoices carry. Legacy AUD price ids are AUD, the
// current price ids and legacy $5 Pro are USD.
const AUD_PRICE_IDS = new Set([
  "price_1TdLiFHxHWKx0vW1hxK3RRYW", "price_1Tgb6SHxHWKx0vW11dqmu96g",
  "price_1TdLiHHxHWKx0vW189oSCDPX", "price_1Tgb6THxHWKx0vW1pSsb9qQ7",
  "price_1TdLiIHxHWKx0vW1BLazXMgu", "price_1Tgb6UHxHWKx0vW1H90R8Xhx",
]);
function subCurrency(s: any): string {
  if (s.currency) return String(s.currency).toLowerCase();
  if (s.stripePriceId && AUD_PRICE_IDS.has(s.stripePriceId)) return "aud";
  return "usd";
}

export async function getBrewstampFinance(opts?: {
  from?: Date;
  to?: Date;
}): Promise<FinanceSummary> {
  await connectDB();
  const to = opts?.to ?? new Date();
  const from = opts?.from ?? new Date("2026-01-01T00:00:00Z");

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

  const subs = (await Subscription.find({}).lean()) as any[];
  // Seed subs never billed anyone.
  const real = subs.filter((s) => !String(s.stripeSubscriptionId ?? "").startsWith("sub_seed_"));
  // First payment per shop tells us when a sub really started (the doc's
  // createdAt is when the webhook first saw it, which is the same day).
  const firstPaid = new Map<string, number>();
  const lastPaid = new Map<string, number>();
  for (const p of (await Payment.find({ status: { $ne: "failed" } }).select("shop paidAt createdAt").lean()) as any[]) {
    const k = String(p.shop);
    const ms = new Date(p.paidAt ?? p.createdAt).getTime();
    firstPaid.set(k, Math.min(firstPaid.get(k) ?? ms, ms));
    lastPaid.set(k, Math.max(lastPaid.get(k) ?? ms, ms));
  }

  for (const s of real) {
    const tier = resolveSub(s);
    const cur = subCurrency(s);
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
    const planName = `Brewstamp ${tier.label}${tier.legacy ? " (legacy)" : ""}`;
    const key = `${planName}|${cur}`;
    const existing = planAgg.get(key);
    if (existing) {
      existing.monthlyCents += m;
      existing.subscriptions += 1;
    } else {
      planAgg.set(key, { plan: planName, currency: cur, monthlyCents: m, subscriptions: 1 });
    }
  }
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
        recent.push({
          date: DAY(when),
          email: ownerEmail.get(String(p.shop)) ?? "?",
          plan: `Brewstamp ${getPlanBySlug(p.planSlug ?? "")?.label ?? "Pro"}`,
          amountCents: p.amountCents,
          currency: cur,
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
    mrrMonthAgo,
    mrrMovement: { newSubscriptions, churnedSubscriptions },
    activeSubscriptions,
    activeCustomers: activeShops.size,
    mrrByPlan: [...planAgg.values()].sort((a, b) => b.monthlyCents - a.monthlyCents),
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
