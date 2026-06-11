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

  const serialized = JSON.parse(JSON.stringify(stampCards));

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
