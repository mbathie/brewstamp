/**
 * Pure finance types + math, safe to import from client components.
 * (The Stripe-backed aggregation lives in finance.ts, which is server-only.)
 *
 * Amounts are in minor units (cents) keyed by lowercase currency code. MRR
 * normalises any billing interval to a monthly figure.
 */

export type CurrencyMap = Record<string, number>; // currency -> cents

export interface PlanMrr {
  plan: string;
  currency: string;
  monthlyCents: number;
  subscriptions: number;
}

export interface MonthRevenue {
  month: string; // YYYY-MM
  byCurrency: CurrencyMap;
}

export interface FinanceSummary {
  generatedAt: string;
  mrr: CurrencyMap;
  arr: CurrencyMap;
  activeSubscriptions: number;
  activeCustomers: number;
  mrrByPlan: PlanMrr[];
  range: { from: string; to: string };
  revenueInRange: CurrencyMap;
  revenueByMonth: MonthRevenue[];
  invoiceCountInRange: number;
  lifetimeRevenue: CurrencyMap;
  lifetimeInvoiceCount: number;
  firstPaymentAt: string | null;
  recentTransactions: Array<{
    date: string;
    email: string;
    plan: string;
    amountCents: number;
    currency: string;
  }>;
}

export interface ProjectionPoint {
  month: string; // YYYY-MM
  mrrCents: number;
  isProjected: boolean;
}

/**
 * Combine a multi-currency map into a single display total. Brewstamp bills in
 * AUD + USD; the admin treats them "at par" (1:1) unless FX rates are given.
 * Returns cents in the target currency.
 */
export function combineAtRate(m: CurrencyMap, rates: Record<string, number> = {}): number {
  let total = 0;
  for (const [cur, cents] of Object.entries(m)) total += cents * (rates[cur] ?? 1);
  return Math.round(total);
}

/**
 * Forward MRR projection. Applies net monthly growth = growthRate − churnRate
 * for `months` steps from `startMrrCents`. Rates are decimals (0.10 = 10%).
 */
export function projectMrr(
  startMrrCents: number,
  opts: { months: number; growthRate: number; churnRate: number; startMonth?: string },
): ProjectionPoint[] {
  const net = 1 + (opts.growthRate - opts.churnRate);
  const out: ProjectionPoint[] = [];
  const base = opts.startMonth ? new Date(opts.startMonth + "-01T00:00:00Z") : new Date();
  let mrr = startMrrCents;
  for (let i = 1; i <= opts.months; i++) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + i);
    mrr = Math.round(mrr * net);
    out.push({ month: d.toISOString().slice(0, 7), mrrCents: mrr, isProjected: true });
  }
  return out;
}

/**
 * Estimate a trailing monthly growth rate from month-over-month revenue (a
 * proxy for MRR trend when historical MRR snapshots aren't stored). Returns a
 * decimal (e.g. 0.15). Falls back to 0 without enough data. Ignores the most
 * recent month if `dropLast` is set (it's usually a partial month).
 */
export function estimateMonthlyGrowth(
  revenueByMonth: MonthRevenue[],
  rates: Record<string, number> = {},
  dropLast = true,
): number {
  let totals = revenueByMonth.map((m) => combineAtRate(m.byCurrency, rates));
  if (dropLast && totals.length > 2) totals = totals.slice(0, -1);
  totals = totals.filter((v) => v > 0);
  if (totals.length < 2) return 0;
  let ratioProduct = 1;
  let steps = 0;
  for (let i = 1; i < totals.length; i++) {
    if (totals[i - 1] > 0) {
      ratioProduct *= totals[i] / totals[i - 1];
      steps += 1;
    }
  }
  return steps === 0 ? 0 : Math.pow(ratioProduct, 1 / steps) - 1;
}
