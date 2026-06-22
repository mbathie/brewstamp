"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Check,
  Minus,
  Loader2,
  Mail,
  ExternalLink,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PLANS,
  getPlanRank,
  annualPriceCents,
  type PlanSlug,
  type BillingInterval,
} from "@/lib/plans";

// "$7" for whole dollars, "$6.42" otherwise.
function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

interface BillingData {
  totalStamps: number;
  limit: number;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    planSlug: string | null;
    interval: BillingInterval | null;
    planLabel: string | null;
    cancelAtPeriodEnd: boolean;
    isSeed: boolean;
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
  const [switchingTo, setSwitchingTo] = useState<PlanSlug | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [portalLoading, setPortalLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Subscription activated!");
    }
  }, [searchParams]);

  const hitShopLimit = searchParams.get("limit") === "1";

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => res.json())
      .then((d: BillingData) => {
        setData(d);
        // Default the toggle to whatever interval the user is already on.
        if (d.subscription?.interval) setInterval(d.subscription.interval);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentSlug: PlanSlug = useMemo(() => {
    const slug = data?.subscription?.planSlug;
    if (slug === "pro" || slug === "plus" || slug === "max") {
      return slug;
    }
    return "free";
  }, [data]);

  const currentRank = useMemo(() => getPlanRank(currentSlug), [currentSlug]);
  const currentInterval = data?.subscription?.interval ?? null;
  const isSeed = data?.subscription?.isSeed ?? false;

  async function handleSwitch(target: PlanSlug) {
    setSwitchingTo(target);
    try {
      if (target === "free") {
        const ok = window.confirm(
          "Downgrade to Free? Your current paid plan keeps working until the end of the period, then cancels.",
        );
        if (!ok) return;
      }

      // Free → Paid uses checkout; everything else uses the switch endpoint.
      const endpoint =
        currentSlug === "free"
          ? "/api/billing/checkout"
          : "/api/billing/switch";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: target, interval }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to switch plan");
        return;
      }

      if (result.url) {
        window.location.href = result.url;
        return;
      }

      if (target === "free") {
        toast.success("Plan will cancel at the end of your current period.");
      } else {
        toast.success(
          `Switched to ${PLANS.find((p) => p.slug === target)?.label}. Prorated credit applied to your next invoice.`,
        );
      }

      // Refresh local state.
      fetch("/api/billing")
        .then((r) => r.json())
        .then(setData);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSwitchingTo(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        toast.error(error || "Failed to open billing portal");
      }
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleResendReceipt(invoiceId: string) {
    setResendingId(invoiceId);
    try {
      const res = await fetch("/api/billing/resend-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (res.ok) toast.success("Receipt sent to your email");
      else toast.error("Failed to send receipt");
    } catch {
      toast.error("Failed to send receipt");
    } finally {
      setResendingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Billing
        </h1>
        <p className="text-muted-foreground">
          You&apos;re currently on the{" "}
          <span className="font-medium text-foreground">
            {PLANS.find((p) => p.slug === currentSlug)?.label}
          </span>{" "}
          plan. Switch tiers anytime — unused time is prorated as a credit on
          your next invoice.
        </p>
        {hitShopLimit && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 p-3 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              You&apos;ve hit the shop limit on your current plan. Upgrade below
              to add another shop — your existing shops keep working.
            </span>
          </div>
        )}
        {isSeed && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              This is a seeded test subscription. Plan switching and the Stripe
              billing portal are disabled until the shop has a real
              Stripe-backed subscription.
            </span>
          </div>
        )}
      </div>

      {/* Billing interval toggle */}
      <div className="flex flex-col items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-border bg-muted/30 p-1 text-sm">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`cursor-pointer rounded-full px-5 py-1.5 font-medium transition ${
              interval === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-5 py-1.5 font-medium transition ${
              interval === "year"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">
              1 month free
            </span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {interval === "year"
            ? "Pay for 11 months, get 12 — on every paid plan."
            : "Switch to annual billing and get a month on us."}
        </p>
      </div>

      {/* Plan grid */}
      <div className="grid gap-5 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrentTier = plan.slug === currentSlug;
          // For a paid tier the user only counts as "on" it when the billing
          // interval matches too — switching monthly↔annual is still a change.
          const isCurrent =
            isCurrentTier &&
            (plan.slug === "free" || currentInterval === interval);
          const isIntervalSwitch =
            isCurrentTier && plan.slug !== "free" && !isCurrent;
          const targetRank = getPlanRank(plan.slug);
          const isUpgrade = targetRank > currentRank;
          const isDowngrade = targetRank < currentRank;
          // Spotlight the recommended tier — but never over the active plan,
          // whose emerald treatment takes precedence.
          const isPopular = plan.slug === "plus" && !isCurrent;
          const isPaid = plan.slug !== "free";
          const annualCents = annualPriceCents(plan);

          let ctaLabel: string;
          if (isCurrent) ctaLabel = "Current plan";
          else if (plan.slug === "free") ctaLabel = "Cancel paid plan";
          else if (isIntervalSwitch)
            ctaLabel =
              interval === "year" ? "Switch to annual" : "Switch to monthly";
          else if (isUpgrade) ctaLabel = `Upgrade to ${plan.label}`;
          else if (isDowngrade) ctaLabel = `Downgrade to ${plan.label}`;
          else ctaLabel = `Switch to ${plan.label}`;

          return (
            <Card
              key={plan.slug}
              className={`relative flex flex-col transition-shadow ${
                isCurrent
                  ? "border-2 border-emerald-500/60"
                  : isPopular
                    ? "border-2 border-amber-600/60 shadow-lg shadow-amber-900/10"
                    : ""
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-medium text-white">
                  Active
                </div>
              )}
              {isPopular && (
                <div className="absolute -top-2.5 right-4 rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-medium text-white">
                  Most popular
                </div>
              )}
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">{plan.label}</CardTitle>
                <CardDescription>{plan.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5 pt-5">
                {/* Price — the focal point of the card */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      {plan.slug === "free"
                        ? plan.priceLabel
                        : interval === "year"
                          ? formatCents(annualCents)
                          : plan.priceLabel}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.slug === "free"
                        ? "forever"
                        : interval === "year"
                          ? "/yr"
                          : "/mo"}
                    </span>
                  </div>
                  {/* Reserved line: keeps card bodies aligned across the
                      monthly/annual toggle. */}
                  <div className="mt-1.5 h-4 text-xs">
                    {isPaid && interval === "year" ? (
                      <span>
                        <span className="font-semibold text-emerald-500">
                          Save {formatCents(plan.priceCents)}/yr
                        </span>
                        <span className="text-muted-foreground">
                          {" · "}
                          {formatCents(Math.round(annualCents / 12))}/mo
                        </span>
                      </span>
                    ) : isPaid ? (
                      <span className="text-muted-foreground">
                        or {formatCents(annualCents)}/yr billed annually
                      </span>
                    ) : null}
                  </div>
                </div>

                <ul className="flex-1 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full cursor-pointer ${
                    (isUpgrade || isPopular) && !isCurrent
                      ? "bg-amber-700 text-white hover:bg-amber-800"
                      : ""
                  }`}
                  variant={isCurrent || isDowngrade ? "outline" : "default"}
                  disabled={isCurrent || isSeed || !!switchingTo}
                  onClick={() => handleSwitch(plan.slug)}
                >
                  {switchingTo === plan.slug ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {ctaLabel}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Compare every plan</CardTitle>
          <CardDescription>
            What you get at each tier, side by side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Feature</TableHead>
                  {PLANS.map((p) => (
                    <TableHead
                      key={p.slug}
                      className={`text-center ${
                        p.slug === currentSlug ? "text-emerald-400" : ""
                      }`}
                    >
                      {p.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <FeatureRow
                  label="Shops"
                  hint="How many separate shop locations you can run under one account, each with its own card, QR code, and customers."
                  values={PLANS.map((p) =>
                    p.shopLimit === 1 ? "1" : `Up to ${p.shopLimit}`,
                  )}
                />
                <FeatureRow
                  label="Stamps per month"
                  hint="On Free you can award 100 stamps in total, ever. Paid plans award unlimited stamps with no monthly cap."
                  values={PLANS.map((p) =>
                    p.stampLimit === "unlimited"
                      ? "Unlimited"
                      : `${p.stampLimit} total`,
                  )}
                />
                <FeatureRow
                  label="Customer analytics"
                  hint="See who visits, how often they come back, your busiest hours, and how close customers are to a reward."
                  values={PLANS.map((p) => p.hasAnalytics)}
                />
                <FeatureRow
                  label="Staff & manager logins"
                  hint="Give baristas and managers their own logins to approve stamps, so you don't have to share one account."
                  values={PLANS.map((p) =>
                    p.hasStaffLogins ? "Unlimited" : false,
                  )}
                />
                <FeatureRow
                  label="CSV customer exports"
                  hint="Download your full customer list — names, emails, stamps, and rewards redeemed — as a spreadsheet."
                  values={PLANS.map((p) => p.hasCsvExport)}
                />
                <FeatureRow
                  label="Cross-shop reporting"
                  hint="Roll up stamps, customers, and redemptions across all your shops into one combined view."
                  values={PLANS.map((p) => p.hasCrossShopReporting)}
                />
                <FeatureRow
                  label="Corporate perk mode"
                  hint="Designed for companies running their own staff coffee program in partnership with a local cafe — every scan is a free reward (no stamps), limited to staff email domains and capped per person per day."
                  values={PLANS.map((p) => p.hasPerkMode)}
                />
                <FeatureRow
                  label="Priority support"
                  hint="Your support emails jump the queue for a faster response."
                  values={PLANS.map((p) => p.prioritySupport)}
                />
                <FeatureRow
                  label="Dedicated support"
                  hint="A named contact who knows your account, for hands-on help and onboarding."
                  values={PLANS.map((p) => p.dedicatedSupport)}
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Manage subscription */}
      {data.subscription && !isSeed && (
        <Card>
          <CardHeader>
            <CardTitle>Manage subscription</CardTitle>
            <CardDescription>
              Update payment method, view invoices, or cancel from Stripe&apos;s
              billing portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handlePortal}
              disabled={portalLoading}
              variant="outline"
              className="cursor-pointer"
            >
              {portalLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 size-4" />
              )}
              Open Billing Portal
            </Button>
            {data.subscription.currentPeriodEnd && (
              <p className="mt-3 text-sm text-muted-foreground">
                {data.subscription.cancelAtPeriodEnd
                  ? "Cancels on: "
                  : "Next billing date: "}
                <span
                  className={
                    data.subscription.cancelAtPeriodEnd
                      ? "text-amber-400"
                      : "text-foreground"
                  }
                >
                  {new Date(
                    data.subscription.currentPeriodEnd,
                  ).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {data.subscription.cancelAtPeriodEnd && (
                  <span className="ml-1">
                    — your plan reverts to Free then.
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction history */}
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
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </TableCell>
                    <TableCell>${(invoice.amount / 100).toFixed(2)}</TableCell>
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

function FeatureRow({
  label,
  values,
  hint,
}: {
  label: string;
  values: Array<string | boolean>;
  hint?: string;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">
        <span className="inline-flex items-center gap-1.5">
          {label}
          {hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`About ${label}`}
                  className="cursor-help text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  <HelpCircle className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-center">
                {hint}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      </TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className="text-center">
          {v === true ? (
            <Check className="mx-auto size-4 text-emerald-500" />
          ) : v === false ? (
            <Minus className="mx-auto size-4 text-stone-500" />
          ) : (
            <span className="text-sm text-muted-foreground">{v}</span>
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}
