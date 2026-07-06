import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { StampCard, Subscription, User, ShopMembership } from "@/models";
import { getCurrentShopContext } from "@/lib/shop-context";
import { AlertTriangle } from "lucide-react";
import { DashboardSidebar } from "./sidebar";
import { StampUsageIndicator } from "@/components/stamp-usage-indicator";
import { getPlanByPriceId } from "@/lib/plans";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardClient from "./dashboard-client";
import ShopSwitcher from "@/components/shop-switcher";

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

  // Self-heal: pre-multi-shop users have user.shopId but no ShopMembership.
  // Without this, getCurrentShopContext sees 0 memberships → redirects to
  // /setup → /setup sees user.shopId and redirects to /dashboard → loop.
  // Mint the owner membership lazily on first dashboard visit.
  await connectDB();
  const userId = session.user.id as string;
  const dbUser = await User.findById(userId);
  if (dbUser?.shopId) {
    const exists = await ShopMembership.exists({
      user: dbUser._id,
      shop: dbUser.shopId,
    });
    if (!exists) {
      await ShopMembership.create({
        user: dbUser._id,
        shop: dbUser.shopId,
        role: "owner",
        acceptedAt: dbUser.createdAt || new Date(),
      });
    }
  }

  const ctx = await getCurrentShopContext();
  if (!ctx) redirect("/login");

  // Brand-new user with no shops at all → setup wizard.
  if (ctx.memberships.length === 0) {
    redirect("/setup");
  }

  // Has shops but hasn't chosen one — solo-shop owners get auto-resolved by
  // the context helper, so reaching mode='unset' here means 2+ memberships.
  if (ctx.mode === "unset") {
    redirect("/select-shop");
  }

  await connectDB();

  const aggregate = ctx.mode === "all";
  const matchShop = aggregate
    ? { $in: ctx.memberships.map((m) => m.shopId) }
    : ctx.shop._id;

  // Aggregate total stamps for usage indicator. In single-shop mode this is
  // scoped to the active shop; in 'all' mode it sums across owned shops.
  const [stampAgg] = await StampCard.aggregate([
    { $match: { shop: matchShop } },
    { $group: { _id: null, total: { $sum: "$totalEarned" } } },
  ]);
  let totalStamps = stampAgg?.total || 0;

  // Dev-only: simulate stamp count via ?stamp=N query param
  if (process.env.NODE_ENV === "development") {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const debugStamp = headersList.get("x-debug-stamp");
    if (debugStamp) totalStamps = parseInt(debugStamp, 10);
  }

  // In single-shop mode the gauge is scoped to that shop's subscription.
  // In aggregate mode we still want to show plan info, so we
  // pick any active sub across the user's owned shops. Phase-3 tier work
  // can refine this to "highest tier across shops" once tiers have an
  // order — for now both shops on the seed account share one tier so any
  // pick is correct.
  const activeSub = aggregate
    ? await Subscription.findOne({
        shop: { $in: ctx.memberships.map((m) => m.shopId) },
        status: "active",
      })
    : await Subscription.findOne({ shop: ctx.shop._id, status: "active" });

  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  const switcherShops = ctx.memberships.map((m) => ({
    shopId: m.shopId,
    shopName: m.shopName,
    role: m.role,
  }));

  // Always show the shop switcher so the "Add a new shop" affordance baked
  // into the dropdown is available on every plan. Single-shop plans (Free/Pro,
  // shopLimit 1) hit the server-side guard in /dashboard/shops/new and get
  // bounced to /dashboard/billing?limit=1 with the upgrade prompt.

  // Billing nav is owner-only. In single-shop mode that's the
  // role on the active shop; in aggregate mode, owning any shop qualifies
  // (getMerchant resolves billing against an owned shop).
  const canManageBilling = aggregate
    ? ctx.memberships.some((m) => m.role === "owner")
    : ctx.memberships.find((m) => m.shopId === ctx.shopId)?.role === "owner";

  return (
    <div className="dark">
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardSidebar
          userName={session.user.name || "Merchant"}
          shopName={aggregate ? "All shops" : ctx.shop.name}
          userEmail={session.user.email || ""}
          canManageBilling={canManageBilling}
        />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1 cursor-pointer text-muted-foreground hover:text-foreground" />
            <ShopSwitcher
              shops={switcherShops}
              currentShopId={aggregate ? null : ctx.shop._id.toString()}
            />
            {aggregate ? (
              <span className="flex items-center gap-1.5 text-sm text-amber-400">
                <AlertTriangle className="size-3.5" />
                Pick a shop to accept stamps
              </span>
            ) : (
              <DashboardClient
                shopCode={ctx.shop.code}
                shopId={ctx.shop._id.toString()}
                threshold={ctx.shop.stampThreshold || 8}
              />
            )}
            <div className="ml-auto flex items-center gap-3">
              <StampUsageIndicator
                totalStamps={totalStamps}
                hasSubscription={!!activeSub}
                planLabel={
                  // Derive from the live stripePriceId so the badge follows
                  // upgrades/downgrades instantly. Old subs without the
                  // planLabel field (or where it lags the price) used to
                  // fall back to "Pro" regardless of tier.
                  (activeSub?.stripePriceId &&
                    getPlanByPriceId(activeSub.stripePriceId)?.label) ||
                  activeSub?.planLabel
                }
              />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
