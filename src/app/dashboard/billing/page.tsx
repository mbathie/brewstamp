"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Zap, Loader2, Mail } from "lucide-react";

interface BillingData {
  totalStamps: number;
  limit: number;
  subscription: {
    status: string;
    currentPeriodEnd: string;
  } | null;
  invoices: {
    id: string;
    date: number;
    amount: number;
    currency: string;
    status: string;
  }[];
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Subscription activated! You now have unlimited stamps.");
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleResendReceipt = async (invoiceId: string) => {
    setResendingId(invoiceId);
    try {
      const res = await fetch("/api/billing/resend-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (res.ok) {
        toast.success("Receipt sent to your email");
      } else {
        toast.error("Failed to send receipt");
      }
    } catch {
      toast.error("Failed to send receipt");
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const isSubscribed = data.subscription?.status === "active";
  const usagePercent = Math.min((data.totalStamps / data.limit) * 100, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view transaction history.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Current Plan
            </CardTitle>
            <CardDescription>
              {isSubscribed
                ? "You're on the Pro plan with unlimited stamps."
                : "You're on the free plan with 100 stamps."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {isSubscribed ? "Pro" : "Free"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed ? "$5/month" : "100 stamps included"}
                </p>
              </div>
              <Badge
                variant={isSubscribed ? "default" : "secondary"}
                className={
                  isSubscribed
                    ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                    : ""
                }
              >
                {isSubscribed ? "Active" : "Free Tier"}
              </Badge>
            </div>

            {!isSubscribed && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stamp usage</span>
                  <span>
                    {data.totalStamps} / {data.limit}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usagePercent >= 90
                        ? "bg-red-500"
                        : usagePercent >= 80
                          ? "bg-orange-500"
                          : usagePercent >= 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            )}

            {isSubscribed && data.subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                Next billing date:{" "}
                <span className="text-foreground">
                  {new Date(
                    data.subscription.currentPeriodEnd
                  ).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              {isSubscribed ? "Manage Subscription" : "Upgrade to Pro"}
            </CardTitle>
            <CardDescription>
              {isSubscribed
                ? "Update payment method, cancel, or view invoices."
                : "Unlock unlimited stamps for your shop."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSubscribed ? (
              <Button
                onClick={handlePortal}
                disabled={portalLoading}
                variant="outline"
                className="w-full"
              >
                {portalLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 size-4" />
                )}
                Open Billing Portal
              </Button>
            ) : (
              <>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Unlimited stamps
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Cancel anytime
                  </li>
                </ul>
                <Button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {checkoutLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 size-4" />
                  )}
                  Upgrade to Pro — $5/month
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      {data.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Your recent invoices and payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {new Date(invoice.date * 1000).toLocaleDateString(
                        "en-AU",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </TableCell>
                    <TableCell>
                      ${(invoice.amount / 100).toFixed(2)}{" "}
                      {invoice.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "paid" ? "default" : "secondary"
                        }
                        className={
                          invoice.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : ""
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.status === "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-xs"
                          disabled={resendingId === invoice.id}
                          onClick={() => handleResendReceipt(invoice.id)}
                        >
                          {resendingId === invoice.id ? (
                            <Loader2 className="mr-1.5 size-3 animate-spin" />
                          ) : (
                            <Mail className="mr-1.5 size-3" />
                          )}
                          Resend Receipt
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
