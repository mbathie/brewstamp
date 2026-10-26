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
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    const planLimits = userId ? await getUserPlanLimits(userId) : null;

    return (
      <DashboardAggregate
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
  const [hasActivity, earnedAgg, hasPerkRedemption, activeDaysAgg] =
    await Promise.all([
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
      // Distinct days with an approved request. A one-session setup test is a
      // single day; real recurring use spans multiple days.
      StampRequest.aggregate([
        { $match: { shop: merchant.shop._id, status: "approved" } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
        },
        { $count: "days" },
      ]),
    ]);
  const totalEarned = earnedAgg[0]?.total ?? 0;
  const hasEarnedStamps = perkMode ? !!hasPerkRedemption : totalEarned > 0;
  const activeDays = activeDaysAgg[0]?.days ?? 0;

  // "Launched" = real recurring use, not just a setup test. A couple of test
  // stamps in one sitting shouldn't retire the go-live checklist — keep nudging
  // until activity spans 2+ days or clears a small volume bar.
  const isLaunched = perkMode
    ? hasEarnedStamps
    : activeDays >= 2 || totalEarned >= 10;

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
      isNewShop={init === "1" || !isLaunched}
      hasEarnedStamps={hasEarnedStamps}
      hasActivity={!!hasActivity}
      needsProfileUpdate={needsProfileUpdate}
      setupComplete={setupComplete}
      canManageBilling={
        ctx.memberships.find((m) => m.shopId === ctx.shopId)?.role === "owner"
      }
    />
  );
}
