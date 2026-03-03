import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, Subscription } from "@/models";
import { DashboardSidebar } from "./sidebar";
import { StampUsageIndicator } from "@/components/stamp-usage-indicator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const shop = await Shop.findById((session.user as any).shopId);

  const shopId = shop?._id;

  // Aggregate total stamps for usage indicator
  const [stampAgg] = shopId
    ? await StampCard.aggregate([
        { $match: { shop: shopId } },
        { $group: { _id: null, total: { $sum: "$totalEarned" } } },
      ])
    : [null];
  let totalStamps = stampAgg?.total || 0;

  // Dev-only: simulate stamp count via ?stamp=N query param
  if (process.env.NODE_ENV === "development") {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const debugStamp = headersList.get("x-debug-stamp");
    if (debugStamp) totalStamps = parseInt(debugStamp, 10);
  }

  // Check subscription status
  const activeSub = shopId
    ? await Subscription.findOne({ shop: shopId, status: "active" })
    : null;

  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <div className="dark">
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardSidebar
          userName={session.user.name || "Merchant"}
          shopName={shop?.name || "My Shop"}
          userEmail={session.user.email || ""}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 cursor-pointer text-muted-foreground hover:text-foreground" />
            <DashboardClient
              shopCode={shop?.code || ""}
              shopId={shop?._id.toString() || ""}
              threshold={shop?.stampThreshold || 8}
            />
            <div className="ml-auto">
              <StampUsageIndicator
                totalStamps={totalStamps}
                hasSubscription={!!activeSub}
              />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
