import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import type {
  CurrencyMap,
  FinanceSummary,
  MonthRevenue,
  PlanMrr,
} from "@/lib/finance-math";

/**
 * Brewstamp financial aggregation, computed live from Stripe.
 *
 * The Stripe account is SHARED with other apps (stampystamp's "Bean"/coffee
 * plans, etc.), so everything here filters to Brewstamp products by name
 * (`/brewstamp/i`). See docs/revenue-snapshots.md for methodology. Amounts are
 * cents keyed by currency; revenue = paid-invoice `amount_paid` (gross of
 * refunds).
 */

function addCur(m: CurrencyMap, currency: string, cents: number) {
  m[currency] = (m[currency] ?? 0) + cents;
}

function monthlyCents(price: Stripe.Price, qty: number): number {
  if (price.unit_amount == null) return 0;
  const iv = price.recurring?.interval;
  const ivc = price.recurring?.interval_count ?? 1;
  let factor = 1;
  if (iv === "year") factor = 1 / (12 * ivc);
  else if (iv === "month") factor = 1 / ivc;
  else if (iv === "week") factor = 52 / 12 / ivc;
  else if (iv === "day") factor = 365 / 12 / ivc;
  return Math.round(price.unit_amount * qty * factor);
}

function priceProductId(price: Stripe.Price | null | undefined): string | null {
  if (!price) return null;
  return typeof price.product === "string" ? price.product : price.product?.id ?? null;
}

async function brewstampProducts(): Promise<{ ids: Set<string>; name: Map<string, string> }> {
  const ids = new Set<string>();
  const name = new Map<string, string>();
  for await (const p of stripe.products.list({ limit: 100 })) {
    name.set(p.id, p.name);
    if (/brewstamp/i.test(p.name)) ids.add(p.id);
  }
  return { ids, name };
}

const DAY = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);

export async function getBrewstampFinance(opts?: {
  from?: Date;
  to?: Date;
}): Promise<FinanceSummary> {
  const to = opts?.to ?? new Date();
  const from = opts?.from ?? new Date("2026-01-01T00:00:00Z");
  const fromSec = Math.floor(from.getTime() / 1000);
  const toSec = Math.floor(to.getTime() / 1000);

  const { ids: brewIds, name: productName } = await brewstampProducts();
  const isBrew = (price: Stripe.Price | null | undefined) => {
    const pid = priceProductId(price);
    return pid ? brewIds.has(pid) : false;
  };

  // ---- Active subscriptions → MRR ----
  const mrr: CurrencyMap = {};
  const planAgg = new Map<string, PlanMrr>();
  const activeCustomerIds = new Set<string>();
  let activeSubscriptions = 0;
  for await (const s of stripe.subscriptions.list({
    status: "all",
    limit: 100,
    expand: ["data.items.data.price"],
  })) {
    if (!["active", "trialing", "past_due"].includes(s.status)) continue;
    const brewItems = s.items.data.filter((it) => isBrew(it.price));
    if (brewItems.length === 0) continue;
    activeSubscriptions += 1;
    activeCustomerIds.add(typeof s.customer === "string" ? s.customer : s.customer.id);
    for (const it of brewItems) {
      const cur = it.price.currency;
      const m = monthlyCents(it.price, it.quantity ?? 1);
      addCur(mrr, cur, m);
      const planName = productName.get(priceProductId(it.price) ?? "") ?? "Brewstamp";
      const key = `${planName}|${cur}`;
      const existing = planAgg.get(key);
      if (existing) {
        existing.monthlyCents += m;
        existing.subscriptions += 1;
      } else {
        planAgg.set(key, { plan: planName, currency: cur, monthlyCents: m, subscriptions: 1 });
      }
    }
  }
  const arr: CurrencyMap = {};
  for (const [cur, cents] of Object.entries(mrr)) arr[cur] = cents * 12;

  // ---- Paid invoices → revenue (in-range, by-month, lifetime, recent) ----
  const revenueInRange: CurrencyMap = {};
  const lifetimeRevenue: CurrencyMap = {};
  const byMonth = new Map<string, CurrencyMap>();
  let invoiceCountInRange = 0;
  let lifetimeInvoiceCount = 0;
  let firstPaymentSec: number | null = null;
  const recent: FinanceSummary["recentTransactions"] = [];

  for await (const inv of stripe.invoices.list({
    status: "paid",
    limit: 100,
    expand: ["data.lines.data"],
  })) {
    if (inv.amount_paid <= 0) continue;
    const prods = inv.lines.data
      .map((l) => (l as any)?.pricing?.price_details?.product as string | undefined)
      .filter(Boolean) as string[];
    const brewProd = prods.find((p) => brewIds.has(p));
    if (!brewProd) continue; // Brewstamp only
    const cur = inv.currency;

    lifetimeInvoiceCount += 1;
    addCur(lifetimeRevenue, cur, inv.amount_paid);
    firstPaymentSec = firstPaymentSec == null ? inv.created : Math.min(firstPaymentSec, inv.created);

    if (inv.created >= fromSec && inv.created <= toSec) {
      invoiceCountInRange += 1;
      addCur(revenueInRange, cur, inv.amount_paid);
      const mk = new Date(inv.created * 1000).toISOString().slice(0, 7);
      const bucket = byMonth.get(mk) ?? {};
      addCur(bucket, cur, inv.amount_paid);
      byMonth.set(mk, bucket);
      if (recent.length < 200) {
        recent.push({
          date: DAY(inv.created),
          email: inv.customer_email ?? "?",
          plan: productName.get(brewProd) ?? "Brewstamp",
          amountCents: inv.amount_paid,
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
    activeSubscriptions,
    activeCustomers: activeCustomerIds.size,
    mrrByPlan: [...planAgg.values()].sort((a, b) => b.monthlyCents - a.monthlyCents),
    range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
    revenueInRange,
    revenueByMonth,
    invoiceCountInRange,
    lifetimeRevenue,
    lifetimeInvoiceCount,
    firstPaymentAt: firstPaymentSec ? DAY(firstPaymentSec) : null,
    recentTransactions: recent.slice(0, 50),
  };
}
