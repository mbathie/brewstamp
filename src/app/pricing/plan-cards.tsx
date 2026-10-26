"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppleMark, GoogleMark } from "@/components/wallet-badges";
import { planAnchor } from "@/lib/structured-data";
import {
  PlanCatalog,
  CUSTOM_PLAN_CONTACT_HREF,
  customPlanCard,
  formatCents,
  type BillingInterval,
  type PlanConfig,
} from "@/lib/plans";

// Pricing cards for the public pages. `plans` is the public catalogue
// (getPlanCatalog().publicPlans) — never the whole list, which would put
// custom deals in the page source.
export default function PlanCards({ plans }: { plans: PlanConfig[] }) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const catalog = new PlanCatalog(plans);
  const paid = catalog.publicPlans.filter((p) => p.slug !== "free");
  // Shown on the toggle: the best annual saving across the paid plans.
  const monthsFree = Math.max(0, ...paid.map((p) => catalog.monthsFree(p)));
  const custom = customPlanCard(Math.max(...catalog.publicPlans.map((p) => p.shopLimit)));
  const cardCount = catalog.publicPlans.length + 1;

  return (
    <>
      {/* Billing interval toggle */}
      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-stone-200 bg-white p-1 text-sm shadow-sm">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`cursor-pointer rounded-full px-5 py-2 font-medium transition ${
              interval === "month"
                ? "bg-amber-700 text-white"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-5 py-2 font-medium transition ${
              interval === "year"
                ? "bg-amber-700 text-white"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Annual
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                interval === "year"
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {monthsFree} months free
            </span>
          </button>
        </div>
      </div>

      <div
        className={`mx-auto grid gap-6 ${
          cardCount > 4
            ? "max-w-7xl sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            : cardCount > 3
              ? "max-w-6xl sm:grid-cols-2 lg:grid-cols-4"
              : "max-w-5xl md:grid-cols-3"
        }`}
      >
        {catalog.publicPlans.map((p) => {
          const highlight = !!p.badge;
          const isFree = p.slug === "free";
          const monthCents = catalog.priceCents(p, "month");
          const annualCents = catalog.priceCents(p, "year");
          return (
            <div
              key={p.slug}
              id={planAnchor(p.label)}
              className={`relative flex scroll-mt-24 flex-col rounded-2xl bg-white p-6 ${
                highlight
                  ? "border-2 border-amber-600 shadow-sm"
                  : "border border-stone-200"
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 right-6 rounded-full bg-amber-700 px-3 py-0.5 text-xs font-medium text-white">
                  {p.badge}
                </div>
              )}
              <h3 className="text-lg font-semibold text-stone-900">
                {p.label}
              </h3>
              <p className="mt-1 text-sm text-stone-500">{p.tagline}</p>
              <p className="mt-5">
                <span className="text-4xl font-bold text-stone-900">
                  {interval === "year" && !isFree
                    ? formatCents(annualCents)
                    : formatCents(monthCents)}
                </span>
                <span className="text-stone-500">
                  {" "}
                  {isFree
                    ? "/month"
                    : interval === "year"
                      ? "/year"
                      : "/month"}
                </span>
              </p>
              {/* Reserve a line for the per-month equivalent so card heights
                  stay aligned across the monthly/annual toggle. */}
              <p className="mt-1 h-4 text-xs text-amber-700">
                {!isFree && interval === "year"
                  ? `${formatCents(Math.round(annualCents / 12))}/mo billed annually · save ${formatCents(monthCents * 12 - annualCents)}`
                  : ""}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-stone-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    {/Wallet passes/.test(f) ? (
                      <span className="inline-flex flex-wrap items-center gap-x-1.5">
                        {f}
                        <AppleMark className="h-4 w-4 text-stone-900" />
                        <GoogleMark className="h-4 w-4" />
                      </span>
                    ) : (
                      f
                    )}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-8">
                <Button className="w-full cursor-pointer bg-amber-700 hover:bg-amber-800">
                  Get started
                </Button>
              </Link>
            </div>
          );
        })}
        <div id="custom" className="relative flex scroll-mt-24 flex-col rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <h3 className="text-lg font-semibold text-stone-900">{custom.label}</h3>
          <p className="mt-1 text-sm text-stone-500">{custom.tagline}</p>
          <p className="mt-5">
            <span className="text-4xl font-bold text-stone-900">Let&apos;s talk</span>
          </p>
          <p className="mt-1 h-4 text-xs text-amber-700">Priced per shop for your group</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-stone-600">
            {custom.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {f}
              </li>
            ))}
          </ul>
          <Link href={CUSTOM_PLAN_CONTACT_HREF} className="mt-8">
            <Button className="w-full cursor-pointer bg-amber-700 hover:bg-amber-800">
              Contact us
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
