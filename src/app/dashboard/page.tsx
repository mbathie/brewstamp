import { getMerchant } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongoose";
import { StampRequest } from "@/models";
import DashboardContent from "@/components/dashboard-content";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ init?: string }>;
}) {
  const merchant = await getMerchant();
  if (!merchant) redirect("/login");

  const { init } = await searchParams;

  await connectDB();
  const hasActivity = await StampRequest.exists({ shop: merchant.shop._id });

  return (
    <DashboardContent
      shopName={merchant.shop.name}
      shopCode={merchant.shop.code}
      shopLogo={merchant.shop.logo || null}
      stampThreshold={merchant.shop.stampThreshold}
      isNewShop={init === "1" || !hasActivity}
    />
  );
}
