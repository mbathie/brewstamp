"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  CreditCard,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PayPalCardFields } from "@/components/paypal-card-fields";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PLANS,
  getPlanRank,
  annualPriceCents,
  planPriceCents,
  type PlanSlug,
  type BillingInterval,
} from "@/lib/plans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// "$7" for whole dollars, "$6.42" otherwise.
function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
// With the currency spelled out — a migrated subscriber may be on A$ or US$.
function moneyWithCode(cents: number, currency: string): string {
  const sym = currency === "aud" ? "A$" : currency === "usd" ? "US$" : currency.toUpperCase() + " ";
  return `${sym}${(cents / 100).toFixed(2)}`;
}

function StatusPill({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  const cls =
    status === "active" && !cancelAtPeriodEnd ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
    : status === "active" ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
    : status === "past_due" ? "border-red-500/30 bg-red-500/15 text-red-300"
    : "border-border text-muted-foreground";
  const label = status === "active" && cancelAtPeriodEnd ? "cancelling" : status === "past_due" ? "payment due" : status;
  return <Badge variant="outline" className={`text-xs font-normal ${cls}`}>{label}</Badge>;
}

interface BillingData {
  totalStamps: number;
  limit: number;
  ownedShops: number;
  // Provider a NEW subscription would bill through; existing subs carry
  // their own provider below.
  provider: "stripe" | "paypal";
  paypalClientId: string | null;
  paypalEnv: "sandbox" | "live";
  subscription: {
    provider: "stripe" | "paypal";
    status: string;
    currentPeriodEnd: string;
    planSlug: string | null;
    interval: BillingInterval | null;
    planLabel: string | null;
    cancelAtPeriodEnd: boolean;
    isSeed: boolean;
    card: { brand?: string; last4?: string; expiry?: string } | null;
    pendingPlanSlug: string | null;
    pendingInterval: BillingInterval | null;
    failedAttempts: number;
    nextAttemptAt: string | null;
    creditCents: number;
    priceCents: number | null;
    currency: string;
  } | null;
  invoices: {
    id: string;
    date: number;
    amount: number;
    currency: string;
    status: string;
    description?: string | null;
    pdf?: string | null;
  }[];
}

const fmtDate = (d: string | number | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  new Date(typeof d === "number" ? d * 1000 : d).toLocaleDateString("en-AU", opts);

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingTo, setSwitchingTo] = useState<PlanSlug | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [portalLoading, setPortalLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  // PayPal inline card dialogs: a first subscription, or replacing the card.
  const [checkout, setCheckout] = useState<{ plan: PlanSlug; interval: BillingInterval } | null>(null);
  const [updatingCard, setUpdatingCard] = useState(false);
  const [tab, setTab] = useState<"plans" | "history">("plans");

  const router = useRouter();
  function reload() {
    // The dashboard layout (plan badge, free-stamp gate on the approval
    // modal) is a server component — refresh it too so an upgrade takes
    // effect everywhere without a hard reload.
    router.refresh();
    return fetch("/api/billing")
      .then((r) => r.json())
      .then(setData);
  }

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
    const sub = data?.subscription;
    if (!sub || sub.status === "canceled") return "free";
    const slug = sub.planSlug;
    if (slug === "pro" || slug === "plus" || slug === "max") {
      return slug;
    }
    return "free";
  }, [data]);

  const currentRank = useMemo(() => getPlanRank(currentSlug), [currentSlug]);
  const currentInterval = currentSlug === "free" ? null : (data?.subscription?.interval ?? null);
  const isSeed = data?.subscription?.isSeed ?? false;
  const sub = data?.subscription ?? null;
  const isPaypalSub = currentSlug !== "free" && sub?.provider === "paypal";
  const canCardCheckout = data?.provider === "paypal" && !!data.paypalClientId;
  const currentPlan = PLANS.find((p) => p.slug === currentSlug)!;

  async function handleSwitch(target: PlanSlug) {
    setSwitchingTo(target);
    try {
      if (target === "free") {
        const ok = window.confirm(
          "Downgrade to Free? Your current paid plan keeps working until the end of the period, then cancels.",
        );
        if (!ok) return;
      }

      // Free → Paid on PayPal: inline card form, no redirect.
      if (currentSlug === "free" && canCardCheckout) {
        setCheckout({ plan: target, interval });
        return;
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

      const label = PLANS.find((p) => p.slug === target)?.label;
      if (target === "free") {
        toast.success("Plan will cancel at the end of your current period.");
      } else if (result.kind === "immediate") {
        toast.success(
          result.chargedCents > 0
            ? `Upgraded to ${label}. Charged ${formatCents(result.chargedCents)} today after crediting your unused time.`
            : `Upgraded to ${label} — fully covered by your remaining credit.`,
        );
      } else if (result.kind === "scheduled") {
        toast.success(`Switching to ${label} on ${fmtDate(result.effectiveAt)} — you keep your current plan until then.`);
      } else if (result.kind === "resumed") {
        toast.success("Subscription resumed.");
      } else {
        toast.success(
          `Switched to ${label}. Prorated credit applied to your next invoice.`,
        );
      }

      // Refresh local state.
      reload();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing</h1>
        <p className="text-muted-foreground">
          {currentSlug === "free"
            ? "Pick a plan when you're ready — no card is charged until you subscribe."
            : "Your subscription, payment method and history. Change plan anytime — unused time is credited."}
        </p>
        {isPaypalSub && !sub?.card && sub?.status !== "canceled" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 p-3 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              We couldn&apos;t save your card for renewals. Your plan is active —
              please add a card below so it renews on {sub?.currentPeriodEnd ? fmtDate(sub.currentPeriodEnd) : "your renewal date"}.
            </span>
          </div>
        )}
        {isPaypalSub && sub?.status === "past_due" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Your last renewal was declined
              {sub.nextAttemptAt ? ` — we'll try again on ${fmtDate(sub.nextAttemptAt)}` : ""}.
              Update your card to keep your plan running.
            </span>
          </div>
        )}
        {isPaypalSub && sub?.pendingPlanSlug && !sub.cancelAtPeriodEnd && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Switching to {PLANS.find((p) => p.slug === sub.pendingPlanSlug)?.label}
              {sub.pendingInterval === "year" ? " (annual)" : " (monthly)"} on {fmtDate(sub.currentPeriodEnd)}.
              You keep your current plan until then.
            </span>
          </div>
        )}
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
              This is a seeded test subscription. Plan switching and billing
              management are disabled until the shop has a real subscription.
            </span>
          </div>
        )}
      </div>

      {/* Subscription at a glance — paying customers see their own billing
          first; Free users get a compact usage strip with the CTA. */}
      {currentSlug !== "free" && sub ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current plan</CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl">
                {currentPlan.label}
                <StatusPill status={sub.status} cancelAtPeriodEnd={sub.cancelAtPeriodEnd} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <span className="text-2xl font-semibold text-foreground">
                  {sub.priceCents != null ? moneyWithCode(sub.priceCents, sub.currency) : formatCents(planPriceCents(currentPlan, currentInterval ?? "month"))}
                </span>{" "}
                / {currentInterval === "year" ? "year" : "month"}
              </div>
              {sub.currentPeriodEnd && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{sub.cancelAtPeriodEnd ? "Ends on " : "Next bill "}</span>
                  <span className={sub.cancelAtPeriodEnd ? "text-amber-400" : "text-foreground"}>{fmtDate(sub.currentPeriodEnd)}</span>
                  {!sub.cancelAtPeriodEnd && sub.creditCents > 0 && (
                    <span className="text-muted-foreground"> · {formatCents(sub.creditCents)} credit applied</span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800" onClick={() => setTab("plans")} disabled={isSeed}>
                  Change plan
                </Button>
                {sub.cancelAtPeriodEnd || sub.pendingPlanSlug ? (
                  <Button size="sm" variant="outline" className="cursor-pointer" disabled={isSeed || !!switchingTo} onClick={() => handleSwitch(currentSlug)}>
                    Keep {currentPlan.label}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="cursor-pointer text-muted-foreground" disabled={isSeed || !!switchingTo} onClick={() => handleSwitch("free")}>
                    Cancel plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Payment method</CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="size-5 text-muted-foreground" />
                {isPaypalSub
                  ? sub.card?.last4
                    ? `${sub.card.brand ? sub.card.brand[0] + sub.card.brand.slice(1).toLowerCase() : "Card"} •••• ${sub.card.last4}`
                    : "No card saved"
                  : "Card on file"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {isPaypalSub
                  ? sub.card?.expiry
                    ? `Expires ${sub.card.expiry.replace("-", "/")} · charged automatically each period.`
                    : "Charged automatically each period."
                  : "Managed securely by Stripe — update your card, view invoices or cancel in the portal."}
              </p>
              {isPaypalSub ? (
                <Button size="sm" variant={sub.card?.last4 ? "outline" : "default"} className={`cursor-pointer ${sub.card?.last4 ? "" : "bg-amber-700 text-white hover:bg-amber-800"}`} onClick={() => setUpdatingCard(true)}>
                  {sub.card?.last4 ? "Update card" : "Add a card"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="cursor-pointer" onClick={handlePortal} disabled={portalLoading || isSeed}>
                  {portalLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ExternalLink className="mr-2 size-4" />}
                  Open billing portal
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Usage</CardDescription>
              <CardTitle className="text-xl">{data.totalStamps.toLocaleString()} stamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {currentPlan.stampLimit === "unlimited" ? "Unlimited stamps on your plan." : `${data.totalStamps} of ${currentPlan.stampLimit} stamps used.`}
              </p>
              <div className="text-sm">
                <span className="text-foreground">{data.ownedShops}</span>
                <span className="text-muted-foreground"> of {currentPlan.shopLimit} shop{currentPlan.shopLimit === 1 ? "" : "s"} used</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.min(100, Math.round((data.ownedShops / currentPlan.shopLimit) * 100))}%` }} />
              </div>
              {data.ownedShops >= currentPlan.shopLimit && currentSlug !== "max" && (
                <button type="button" onClick={() => setTab("plans")} className="cursor-pointer text-xs text-amber-400 hover:underline">
                  Need another shop? Upgrade →
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <div className="text-sm text-muted-foreground">Current plan</div>
              <div className="text-lg font-semibold text-foreground">Free · {data.totalStamps} of {data.limit} stamps used</div>
              <div className="mt-2 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${data.totalStamps >= data.limit ? "bg-red-500" : "bg-amber-600"}`} style={{ width: `${Math.min(100, Math.round((data.totalStamps / data.limit) * 100))}%` }} />
              </div>
            </div>
            <Button className="cursor-pointer bg-amber-700 text-white hover:bg-amber-800" onClick={() => { setTab("plans"); document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
              Choose a plan
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as "plans" | "history")} className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans" className="cursor-pointer">Plans</TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">
            Billing history
            {data.invoices.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{data.invoices.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" id="plans" className="space-y-6">
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

          const canResume =
            isCurrent && isPaypalSub && !!(sub?.cancelAtPeriodEnd || sub?.pendingPlanSlug);

          let ctaLabel: string;
          if (canResume) ctaLabel = "Keep this plan";
          else if (isCurrent) ctaLabel = "Current plan";
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
                  disabled={(isCurrent && !canResume) || isSeed || !!switchingTo}
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
                  label="Apple & Google Wallet passes"
                  hint="Customers add their loyalty card to Apple Wallet or Google Wallet — lock-screen presence and push updates when they earn a stamp. The browser card still works for everyone."
                  values={PLANS.map((p) => p.hasWalletPasses)}
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

        </TabsContent>

        <TabsContent value="history" className="space-y-6">
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
                    <TableCell>
                      ${(invoice.amount / 100).toFixed(2)}
                      {invoice.description && (
                        <span className="ml-2 text-xs text-muted-foreground">{invoice.description}</span>
                      )}
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
                    <TableCell className="space-x-2 text-right">
                      {invoice.pdf && (
                        <Button asChild variant="outline" size="sm" className="h-7 px-3 text-xs">
                          <a href={invoice.pdf} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1.5 size-3" />
                            Invoice
                          </a>
                        </Button>
                      )}
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
          {data.invoices.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No payments yet. Your receipts will appear here once you subscribe.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* PayPal: first subscription — card entered inline, in a side sheet */}
      <Sheet open={!!checkout} onOpenChange={(o) => !o && setCheckout(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
          {checkout && data.paypalClientId && (() => {
            const plan = PLANS.find((p) => p.slug === checkout.plan)!;
            const cents = checkout.interval === "year" ? annualPriceCents(plan) : plan.priceCents;
            const renews = new Date();
            if (checkout.interval === "year") renews.setFullYear(renews.getFullYear() + 1);
            else renews.setMonth(renews.getMonth() + 1);
            return (
              <>
                <SheetHeader>
                  <SheetTitle>Subscribe to {plan.label}</SheetTitle>
                  <SheetDescription>{plan.tagline}. Cancel anytime from this page.</SheetDescription>
                </SheetHeader>
                <div className="space-y-6 px-4 pb-6">
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium text-foreground">
                        {plan.label} · {checkout.interval === "year" ? "annual" : "monthly"}
                      </span>
                      <span className="text-lg font-semibold text-foreground">
                        {formatCents(cents)}
                        <span className="text-xs font-normal text-muted-foreground"> USD</span>
                      </span>
                    </div>
                    {checkout.interval === "year" && (
                      <div className="mt-1 text-xs text-emerald-500">
                        1 month free — {formatCents(Math.round(cents / 12))}/mo equivalent
                      </div>
                    )}
                    <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Charged today</span><span className="text-foreground">{formatCents(cents)}</span></div>
                      <div className="flex justify-between"><span>Renews</span><span className="text-foreground">{fmtDate(renews)}</span></div>
                    </div>
                  </div>
                  <PayPalCardFields
                    mode="checkout"
                    clientId={data.paypalClientId}
                    plan={checkout.plan}
                    interval={checkout.interval}
                    submitLabel={`Pay ${formatCents(cents)} and subscribe`}
                    onSuccess={() => {
                      setCheckout(null);
                      toast.success("Subscription activated!");
                      reload();
                    }}
                  />
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* PayPal: replace the saved card (no charge) */}
      <Sheet open={updatingCard} onOpenChange={setUpdatingCard}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
          {data.paypalClientId && (
            <>
              <SheetHeader>
                <SheetTitle>Update card</SheetTitle>
                <SheetDescription>
                  The new card replaces {sub?.card?.last4 ? `•••• ${sub.card.last4}` : "your saved card"} and is used from the next renewal. Nothing is charged now.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                {updatingCard && (
                  <PayPalCardFields
                    mode="update"
                    clientId={data.paypalClientId}
                    submitLabel="Save card"
                    onSuccess={() => {
                      setUpdatingCard(false);
                      toast.success("Card updated");
                      reload();
                    }}
                  />
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
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
