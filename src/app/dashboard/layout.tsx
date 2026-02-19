import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import { Shop } from "@/models";
import { DashboardSidebar } from "./sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardClient from "./dashboard-client";
import { Toaster } from "sonner";

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

  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <div className="dark">
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardSidebar
          userName={session.user.name || "Merchant"}
          shopName={shop?.name || "My Shop"}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 cursor-pointer text-muted-foreground hover:text-foreground" />
            <DashboardClient
              shopCode={shop?.code || ""}
              shopId={shop?._id.toString() || ""}
              threshold={shop?.stampThreshold || 8}
            />
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster theme="dark" position="top-right" duration={10000} />
    </div>
  );
}
