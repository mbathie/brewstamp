import { getMerchant } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongoose";
import { StampRequest, StampCard } from "@/models";
import DashboardContent from "@/components/dashboard-content";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ init?: string }>;
}) {
  const merchant = await getMerchant();
  if (!merchant) redirect("/login");
  if (!merchant.shop) redirect("/setup");

  const { init } = await searchParams;

  await connectDB();
  const [hasActivity, earnedAgg] = await Promise.all([
    StampRequest.exists({ shop: merchant.shop._id }),
    StampCard.aggregate([
      { $match: { shop: merchant.shop._id } },
      { $group: { _id: null, total: { $sum: "$totalEarned" } } },
    ]),
  ]);
  const hasEarnedStamps = (earnedAgg[0]?.total ?? 0) > 0;

  const needsProfileUpdate =
    !merchant.user.phone ||
    merchant.user.name === merchant.user.email.split("@")[0];

  return (
    <DashboardContent
      shopName={merchant.shop.name}
      shopCode={merchant.shop.code}
      shopLogo={merchant.shop.logo || null}
      stampThreshold={merchant.shop.stampThreshold}
      isNewShop={init === "1" || !hasActivity}
      hasEarnedStamps={hasEarnedStamps}
      hasActivity={!!hasActivity}
      needsProfileUpdate={needsProfileUpdate}
    />
  );
}
