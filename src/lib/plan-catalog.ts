// Server-side loader for the plan catalogue in the `plans` collection. Cached
// in-process for a minute so billing paths don't hit the database on every
// call; a catalogue change (scripts/seed-plans.ts) shows up within that.
// Client components never import this — they get plans as props or from
// /api/billing and build a PlanCatalog themselves.
import { connectDB } from "./mongoose";
import Plan from "../models/Plan";
import { PlanCatalog, type PlanConfig } from "./plans";

const TTL_MS = 60_000;
const KEY = Symbol.for("brewstamp.planCatalog");

type Cache = { catalog: PlanCatalog; at: number } | null;

function cache(): { value: Cache; loading: Promise<PlanCatalog> | null } {
  const g = globalThis as any;
  if (!g[KEY]) g[KEY] = { value: null, loading: null };
  return g[KEY];
}

/** Plain plan objects as stored, minus Mongo bookkeeping — safe to send to the client. */
export function toPlanConfig(doc: any): PlanConfig {
  return {
    slug: doc.slug,
    label: doc.label,
    tagline: doc.tagline ?? "",
    rank: doc.rank,
    status: doc.status,
    badge: doc.badge ?? null,
    shopLimit: doc.shopLimit,
    stampLimit: doc.stampLimit,
    staffLoginLimit: doc.staffLoginLimit,
    hasCsvExport: !!doc.hasCsvExport,
    hasAnalytics: !!doc.hasAnalytics,
    hasCrossShopReporting: !!doc.hasCrossShopReporting,
    hasPerkMode: !!doc.hasPerkMode,
    hasWalletPasses: doc.hasWalletPasses !== false,
    prioritySupport: !!doc.prioritySupport,
    dedicatedSupport: !!doc.dedicatedSupport,
    features: [...(doc.features ?? [])],
    prices: (doc.prices ?? []).map((p: any) => ({
      interval: p.interval,
      amountCents: p.amountCents,
      currency: p.currency,
      account: p.account,
      stripePriceId: p.stripePriceId ?? null,
      status: p.status,
    })),
  };
}

/**
 * Read the catalogue on the current mongoose connection, uncached. For
 * scripts that open their own connection; app code uses getPlanCatalog().
 */
export async function readPlanCatalog(): Promise<PlanCatalog> {
  const docs = await Plan.find({}).lean();
  if (!docs.length) throw new Error("The plans collection is empty — run scripts/seed-plans.ts");
  return new PlanCatalog(docs.map(toPlanConfig));
}

async function load(): Promise<PlanCatalog> {
  await connectDB();
  return readPlanCatalog();
}

export async function getPlanCatalog(): Promise<PlanCatalog> {
  const c = cache();
  if (c.value && Date.now() - c.value.at < TTL_MS) return c.value.catalog;
  if (!c.loading) {
    c.loading = load()
      .then((catalog) => {
        c.value = { catalog, at: Date.now() };
        return catalog;
      })
      .catch((err) => {
        // Serve the last good catalogue through a database blip rather than
        // failing every billing request.
        if (c.value) {
          console.error("[plans] reload failed, serving cached catalogue:", err?.message);
          return c.value.catalog;
        }
        throw err;
      })
      .finally(() => {
        c.loading = null;
      });
  }
  return c.loading;
}

/** Drop the cached catalogue so the next read reloads it. */
export function invalidatePlanCatalog() {
  cache().value = null;
}
