import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, Stamp, Gift, Plus } from "lucide-react";
import SwitchShopRow from "@/components/switch-shop-row";

interface PerShop {
  shopId: string;
  shopName: string;
  customers: number;
  stamps: number;
  redemptions: number;
}

interface Props {
  shops: PerShop[];
  // Active plan's shop-limit headroom — used to muted-out the "Add a shop"
  // button and redirect to billing instead of /shops/new when capped.
  atShopLimit?: boolean;
  shopLimit?: number;
  planLabel?: string;
}

// Phase-1 aggregate view shown when the user picks "All shops". Stays
// intentionally simple — rollup KPIs + per-shop breakdown — so we can ship
// the multi-shop switcher without rewriting the full single-shop dashboard.
export default function DashboardAggregate({
  shops,
  atShopLimit = false,
  shopLimit = 1,
  planLabel = "your",
}: Props) {
  const totals = shops.reduce(
    (acc, s) => ({
      customers: acc.customers + s.customers,
      stamps: acc.stamps + s.stamps,
      redemptions: acc.redemptions + s.redemptions,
    }),
    { customers: 0, stamps: 0, redemptions: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All shops</h1>
        <p className="text-sm text-muted-foreground">
          Combined activity across {shops.length} shops you own.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.customers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stamps earned</CardTitle>
            <Stamp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.stamps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards redeemed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.redemptions}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Switch shop</CardTitle>
          {atShopLimit ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-amber-700/40 px-2.5 py-1 text-xs text-amber-500 transition-colors hover:bg-amber-700/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add a shop
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  You&apos;re at the {shopLimit}-shop limit on the {planLabel} plan.
                  Upgrade to add more.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link
              href="/dashboard/shops/new"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-amber-700/40 px-2.5 py-1 text-xs text-amber-500 transition-colors hover:bg-amber-700/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Add a shop
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead className="text-right">Customers</TableHead>
                <TableHead className="text-right">Stamps</TableHead>
                <TableHead className="text-right">Redemptions</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((s) => (
                <SwitchShopRow
                  key={s.shopId}
                  shopId={s.shopId}
                  shopName={s.shopName}
                  customers={s.customers}
                  stamps={s.stamps}
                  redemptions={s.redemptions}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
