import { redirect } from "next/navigation";
import { auth, getMerchant } from "@/lib/auth";
import { getCurrentShopContext } from "@/lib/shop-context";
import { getUserPlanLimits } from "@/lib/plan-limits";
import { connectDB } from "@/lib/mongoose";
import { StampRequest, StampCard } from "@/models";
import DashboardContent from "@/components/dashboard-content";
import DashboardAggregate from "@/components/dashboard-aggregate";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ init?: string }>;
}) {
  const ctx = await getCurrentShopContext();
  if (!ctx) redirect("/login");
  if (ctx.memberships.length === 0) redirect("/setup");
  if (ctx.mode === "unset") redirect("/select-shop");

  await connectDB();

  if (ctx.mode === "all") {
    const shopIds = ctx.allShops.map((s) => s._id);

    // Per-shop rollup: customers / stamps / redemptions. Customers are
    // counted via distinct customer ids on stamp cards for the shop so a
    // single customer with cards at multiple shops counts once per shop.
    const [stampAgg, redeemAgg, customerAgg] = await Promise.all([
      StampCard.aggregate([
        { $match: { shop: { $in: shopIds } } },
        {
          $group: {
            _id: "$shop",
            stamps: { $sum: "$totalEarned" },
          },
        },
      ]),
      StampRequest.aggregate([
        {
          $match: { shop: { $in: shopIds }, redeem: true, status: "approved" },
        },
        { $group: { _id: "$shop", count: { $sum: 1 } } },
      ]),
      StampCard.aggregate([
        { $match: { shop: { $in: shopIds } } },
        { $group: { _id: "$shop", customers: { $addToSet: "$customer" } } },
        {
          $project: {
            _id: 1,
            customers: { $size: "$customers" },
          },
        },
      ]),
    ]);

    const stampByShop = new Map(
      stampAgg.map((s) => [s._id.toString(), s.stamps]),
    );
    const redeemByShop = new Map(
      redeemAgg.map((r) => [r._id.toString(), r.count]),
    );
    const customerByShop = new Map(
      customerAgg.map((c) => [c._id.toString(), c.customers]),
    );

    const perShop = ctx.allShops
      .map((s) => ({
        shopId: s._id.toString(),
        shopName: s.name,
        customers: customerByShop.get(s._id.toString()) || 0,
        stamps: stampByShop.get(s._id.toString()) || 0,
        redemptions: redeemByShop.get(s._id.toString()) || 0,
      }))
      .sort((a, b) => b.stamps - a.stamps);

    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    const planLimits = userId ? await getUserPlanLimits(userId) : null;

    return (
      <DashboardAggregate
        shops={perShop}
        atShopLimit={planLimits?.atShopLimit ?? false}
        shopLimit={planLimits?.shopLimit ?? 1}
        planLabel={planLimits?.plan.label ?? "Free"}
      />
    );
  }

  // Single-shop path — unchanged from pre-multi-shop.
  const merchant = await getMerchant();
  if (!merchant) redirect("/login");
  if (!merchant.shop) redirect("/setup");

  const { init } = await searchParams;

  const perkMode = !!merchant.shop.perkMode;
  const [hasActivity, earnedAgg, hasPerkRedemption] = await Promise.all([
    StampRequest.exists({ shop: merchant.shop._id }),
    StampCard.aggregate([
      { $match: { shop: merchant.shop._id } },
      { $group: { _id: null, total: { $sum: "$totalEarned" } } },
    ]),
    // Perk shops never award stamps, so onboarding completes on the first
    // approved free coffee instead of the first stamp earned.
    perkMode
      ? StampRequest.exists({
          shop: merchant.shop._id,
          status: "approved",
          redeem: true,
        })
      : Promise.resolve(null),
  ]);
  const hasEarnedStamps = perkMode
    ? !!hasPerkRedemption
    : (earnedAgg[0]?.total ?? 0) > 0;

  const needsProfileUpdate =
    !merchant.user.phone ||
    merchant.user.name === merchant.user.email.split("@")[0];

  const customColors =
    merchant.shop.bgColor !== "stone-800" ||
    merchant.shop.fgColor !== "amber-600";
  const customPattern =
    !!merchant.shop.bgPattern && merchant.shop.bgPattern !== "none";
  const setupComplete = !!merchant.shop.logo || customColors || customPattern;

  return (
    <DashboardContent
      shopName={merchant.shop.name}
      shopCode={merchant.shop.code}
      shopLogo={merchant.shop.logo || null}
      stampThreshold={merchant.shop.stampThreshold}
      perkMode={!!merchant.shop.perkMode}
      isNewShop={init === "1" || !hasActivity}
      hasEarnedStamps={hasEarnedStamps}
      hasActivity={!!hasActivity}
      needsProfileUpdate={needsProfileUpdate}
      setupComplete={setupComplete}
    />
  );
}
