"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Coffee,
  CreditCard,
  Home,
  Users,
  IdCard,
  Store,
  LogOut,
  ChevronUp,
  UserCog,
  BarChart3,
  Ticket,
  DollarSign,
  Handshake,
  ScrollText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ADMIN_EMAIL = "mbathie@gmail.com";

type NavItem = {
  title: string;
  href: string;
  icon: typeof Home;
  /** Hidden from managers and staff (Billing). */
  ownerOnly?: boolean;
  /** Hidden from staff (Team, Shop setup). */
  managerUp?: boolean;
  /** Hidden from the owner on a shop their plan on another shop pays for:
   *  these pages cover all their shops, so they live on the main one. */
  mainShopOnly?: boolean;
};

// Grouped by job: running the shop day to day first, account admin below.
// The role flags only avoid showing links that would 403 — the API routes
// enforce the same gates server-side.
const shopItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Customers", href: "/dashboard/customers", icon: Users },
  { title: "Shop setup", href: "/dashboard/settings", icon: Store, managerUp: true },
];

const manageItems: NavItem[] = [
  { title: "Team", href: "/dashboard/team", icon: IdCard, managerUp: true, mainShopOnly: true },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard, ownerOnly: true, mainShopOnly: true },
  { title: "Partners", href: "/dashboard/partners", icon: Handshake, mainShopOnly: true },
];

const adminItems = [
  { title: "Stats", href: "/dashboard/admin/shops", icon: BarChart3 },
  { title: "Finance", href: "/dashboard/admin/finance", icon: DollarSign },
  { title: "Paying customers", href: "/dashboard/admin/customers", icon: CreditCard },
  { title: "Discounts", href: "/dashboard/admin/discounts", icon: Ticket },
  { title: "Partners", href: "/dashboard/admin/partners", icon: Handshake },
  { title: "Server logs", href: "/dashboard/admin/logs", icon: ScrollText },
];

export function DashboardSidebar({
  userName,
  shopName,
  userEmail,
  canManageBilling = true,
  canManageTeam = true,
  coveredShop = false,
}: {
  userName: string;
  shopName: string;
  userEmail: string;
  canManageBilling?: boolean;
  canManageTeam?: boolean;
  coveredShop?: boolean;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const visible = (items: NavItem[]) =>
    items.filter(
      (i) =>
        (!i.ownerOnly || canManageBilling) &&
        (!i.managerUp || canManageTeam) &&
        !(i.mainShopOnly && coveredShop),
    );

  const group = (label: string | null, items: NavItem[]) =>
    items.length > 0 && (
      <SidebarGroup>
        {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)}
                  tooltip={item.title}
                >
                  <Link href={item.href} onClick={() => setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-amber-700 text-white">
                  <Coffee className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{shopName}</span>
                  <span className="truncate text-xs text-muted-foreground font-[family-name:var(--font-logo)] tracking-wide">
                    Brewstamp
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {group(null, visible(shopItems))}
        {group("Manage", visible(manageItems))}

        {userEmail === ADMIN_EMAIL && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.title}
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="cursor-pointer data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userName}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                align="start"
              >
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/account" onClick={() => setOpenMobile(false)}>
                    <UserCog className="mr-2 size-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
