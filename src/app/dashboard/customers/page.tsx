import { redirect } from "next/navigation";
import { getCurrentShopContext } from "@/lib/shop-context";
import { getShopPlanLimits, getUserPlanLimits } from "@/lib/plan-limits";
import { connectDB } from "@/lib/mongoose";
import { StampCard, StampRequest } from "@/models";
import { startOfDayInTz } from "@/lib/perk";
import CustomerSearch from "@/components/customer-search";

/**
 * Reporting windows for perk shops. `freeRedeemed` on the card is a lifetime
 * counter, which can't answer "how many did this person have this week" — the
 * question an employer paying for the perk actually asks.
 */
export type PerkRange = "7d" | "30d" | "mtd" | "all";

export const PERK_RANGE_LABELS: Record<PerkRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "This month",
  all: "All time",
};

function isPerkRange(v: string | undefined): v is PerkRange {
  return v === "7d" || v === "30d" || v === "mtd" || v === "all";
}

/**
 * Start of the reporting window as a UTC instant, snapped to local midnight in
 * the shop's timezone. Each candidate is re-snapped with `startOfDayInTz`
 * rather than trusted as a 24h multiple, so a DST shift can't leave the
 * boundary an hour inside the wrong day.
 */
function perkRangeStart(range: PerkRange, tz: string): Date | null {
  if (range === "all") return null;
  const today = startOfDayInTz(tz);
  if (range === "mtd") {
    // Local day-of-month, so we can step back to the 1st.
    const dom = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, day: "numeric" }).format(
        today,
      ),
    );
    return startOfDayInTz(tz, new Date(today.getTime() - (dom - 1) * 864e5));
  }
  const days = range === "7d" ? 6 : 29;
  return startOfDayInTz(tz, new Date(today.getTime() - days * 864e5));
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const ctx = await getCurrentShopContext();
  if (!ctx) redirect("/login");
  if (ctx.memberships.length === 0) redirect("/setup");
  if (ctx.mode === "unset") redirect("/select-shop");

  await connectDB();

  const aggregate = ctx.mode === "all";
  const shopFilter = aggregate
    ? { $in: ctx.memberships.map((m) => m.shopId) }
    : ctx.shop._id;

  const stampCards = await StampCard.find({ shop: shopFilter })
    .populate("customer", "name cookieId email")
    .populate("shop", "name stampThreshold")
    .sort({ updatedAt: -1 });

  // In perk mode the work email is the identity, so collapse any records that
  // share one (a legacy cleared-cookie duplicate) to a single, most-recently
  // active row. Anonymous, no-email scanners are left untouched.
  const perkShop = !aggregate && !!ctx.shop.perkMode;
  const deduped = perkShop
    ? (() => {
        const seen = new Set<string>();
        return stampCards.filter((card: any) => {
          const email = card.customer?.email?.trim().toLowerCase();
          if (!email) return true;
          if (seen.has(email)) return false;
          seen.add(email);
          return true;
        });
      })()
    : stampCards;

  const serialized = JSON.parse(JSON.stringify(deduped));

  // Perk usage is counted by EMAIL, not by stamp card — the same identity the
  // daily cap uses (see countPerkDrinksToday). Counting by card would under-
  // report anyone holding a duplicate customer record, which is exactly the
  // person an employer is trying to look at.
  const { range: rangeParam } = await searchParams;
  const range: PerkRange = isPerkRange(rangeParam) ? rangeParam : "30d";
  let perkStats: Record<
    string,
    { inRange: number; today: number; lifetime: number }
  > | null = null;

  if (perkShop) {
    const tz = ctx.shop.timezone || "UTC";
    const start = perkRangeStart(range, tz);
    const todayStart = startOfDayInTz(tz);

    const rows = await StampRequest.aggregate([
      // Approved only — a rejected or expired request was never a drink. No
      // `redeem` filter: in perk mode every approved request is a free drink,
      // which is the same set the daily cap counts.
      {
        $match: {
          shop: ctx.shop._id,
          status: "approved",
          email: { $type: "string" },
        },
      },
      {
        $group: {
          _id: "$email",
          lifetime: { $sum: 1 },
          inRange: {
            $sum: start ? { $cond: [{ $gte: ["$createdAt", start] }, 1, 0] } : 1,
          },
          today: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0] } },
        },
      },
    ]);

    perkStats = {};
    for (const r of rows) {
      perkStats[r._id] = {
        inRange: r.inRange,
        today: r.today,
        lifetime: r.lifetime,
      };
    }
  }

  // CSV export is a Plus+ feature. On Free/Pro the button still
  // renders but is disabled with an upgrade tooltip — so people see the
  // capability exists and know where it lives once they upgrade.
  //
  // Single shop → gate on that shop's OWNER plan (so staff/managers see the
  // feature the owner pays for). Aggregate → the viewer is the multi-shop
  // owner, so their own effective plan is the right answer.
  const limits = aggregate
    ? await getUserPlanLimits(ctx.userId)
    : await getShopPlanLimits(ctx.shop._id.toString());

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Customers</h1>
      <CustomerSearch
        stampCards={serialized}
        threshold={aggregate ? 8 : ctx.shop.stampThreshold}
        aggregate={aggregate}
        perkMode={perkShop}
        perkStats={perkStats}
        perkRange={range}
        perkRangeLabel={PERK_RANGE_LABELS[range]}
        perkDailyLimit={perkShop ? ctx.shop.dailyDrinkLimit || 2 : undefined}
        canExportCsv={limits.plan.hasCsvExport}
        planLabel={limits.plan.label}
      />
    </div>
  );
}
