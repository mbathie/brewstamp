import { redirect } from "next/navigation";
import { getCurrentShopContext } from "@/lib/shop-context";
import { getShopPlanLimits, getUserPlanLimits } from "@/lib/plan-limits";
import { connectDB } from "@/lib/mongoose";
import { StampCard } from "@/models";
import CustomerSearch from "@/components/customer-search";

export default async function CustomersPage() {
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
        perkMode={!aggregate && !!ctx.shop.perkMode}
        canExportCsv={limits.plan.hasCsvExport}
        planLabel={limits.plan.label}
      />
    </div>
  );
}
