"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Stamp,
  Gift,
  Check,
  X,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ADMIN_EMAIL = "mbathie@gmail.com";

interface ShopDetail {
  shop: {
    _id: string;
    name: string;
    code: string;
    stampThreshold: number;
    bgColor: string;
    fgColor: string;
    createdAt: string;
    dripDay3Sent: boolean;
    dripDay7Sent: boolean;
    owner: { name: string; email: string; phone?: string };
  };
  customers: {
    name: string | null;
    email: string | null;
    cookieId: string | null;
    stamps: number;
    totalEarned: number;
    freeRedeemed: number;
    lastVisit: string;
  }[];
  stats: {
    totalCustomers: number;
    totalApproved: number;
    totalRejected: number;
    totalRedeems: number;
    totalStampsAwarded: number;
    firstActivity: string | null;
    lastActivity: string | null;
  };
  dailyActivity: {
    _id: string;
    stamps: number;
    visits: number;
    redeems: number;
  }[];
  recentRequests: {
    status: string;
    stampsAwarded: number;
    redeem: boolean;
    customerName: string | null;
    customerEmail: string | null;
    createdAt: string;
  }[];
}

export default function AdminShopDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const [data, setData] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== ADMIN_EMAIL) {
      redirect("/dashboard");
    }

    fetch(`/api/admin/shops/${params.id}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, status, params.id]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!data?.shop) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Shop not found</p>
      </div>
    );
  }

  const { shop, customers, stats, dailyActivity, recentRequests } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/admin/shops"
          className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {shop.name}
            </h1>
            <a
              href={`/s/${shop.code}?checkin=0`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            {shop.owner.name} &middot; {shop.owner.email}
            {shop.owner.phone && ` \u00B7 ${shop.owner.phone}`}
          </p>
          <p className="text-xs text-muted-foreground">
            Code: <span className="font-mono">{shop.code}</span> &middot;
            Threshold: {shop.stampThreshold} stamps &middot; Signed up{" "}
            {new Date(shop.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stamps Given
            </CardTitle>
            <Stamp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalStampsAwarded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Free Drinks Redeemed
            </CardTitle>
            <Gift className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalRedeems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Activity
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.lastActivity
                ? new Date(stats.lastActivity).toLocaleDateString()
                : "Never"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Drip status */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {shop.dripDay3Sent ? (
            <Check className="size-3 text-green-500" />
          ) : (
            <X className="size-3 text-red-400" />
          )}
          Day 3 drip
        </span>
        <span className="flex items-center gap-1">
          {shop.dripDay7Sent ? (
            <Check className="size-3 text-green-500" />
          ) : (
            <X className="size-3 text-red-400" />
          )}
          Day 7 drip
        </span>
      </div>

      {/* Customers table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Customers ({customers.length})
        </h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Current Stamps</TableHead>
                <TableHead className="text-right">Total Earned</TableHead>
                <TableHead className="text-right">Free Drinks</TableHead>
                <TableHead>Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No customers yet
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {c.name || (
                        <span className="text-muted-foreground">Anonymous</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.email || (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{c.stamps}</TableCell>
                    <TableCell className="text-right">{c.totalEarned}</TableCell>
                    <TableCell className="text-right">
                      {c.freeRedeemed}
                    </TableCell>
                    <TableCell>
                      {new Date(c.lastVisit).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Daily activity */}
      {dailyActivity.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Daily Activity (Last 30 Days)
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Stamps</TableHead>
                  <TableHead className="text-right">Redeems</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyActivity.map((day) => (
                  <TableRow key={day._id}>
                    <TableCell>
                      {new Date(day._id + "T00:00:00").toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">{day.visits}</TableCell>
                    <TableCell className="text-right">{day.stamps}</TableCell>
                    <TableCell className="text-right">{day.redeems}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Recent requests */}
      {recentRequests.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Recent Requests (Last 50)
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Stamps</TableHead>
                  <TableHead>Redeem</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {r.customerName || r.customerEmail || (
                        <span className="text-muted-foreground">Anonymous</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          r.status === "approved"
                            ? "text-green-500"
                            : r.status === "rejected"
                              ? "text-red-400"
                              : "text-muted-foreground"
                        }
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.stampsAwarded ?? "—"}
                    </TableCell>
                    <TableCell>
                      {r.redeem ? (
                        <Gift className="size-4 text-amber-500" />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
