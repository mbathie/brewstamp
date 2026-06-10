"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PLANS,
  annualPriceCents,
  type BillingInterval,
} from "@/lib/plans";

// "$7" for whole dollars, "$6.42" otherwise.
function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export default function PlanCards() {
  const [interval, setInterval] = useState<BillingInterval>("month");

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
              1 month free
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const highlight = p.slug === "plus";
          const isFree = p.slug === "free";
          const annualCents = annualPriceCents(p);
          return (
            <div
              key={p.slug}
              className={`relative flex flex-col rounded-2xl bg-white p-6 ${
                highlight
                  ? "border-2 border-amber-600 shadow-sm"
                  : "border border-stone-200"
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 right-6 rounded-full bg-amber-700 px-3 py-0.5 text-xs font-medium text-white">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-stone-900">
                {p.label}
              </h3>
              <p className="mt-1 text-sm text-stone-500">{p.tagline}</p>
              <p className="mt-5">
                <span className="text-4xl font-bold text-stone-900">
                  {isFree
                    ? p.priceLabel
                    : interval === "year"
                      ? formatCents(annualCents)
                      : p.priceLabel}
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
                  ? `${formatCents(Math.round(annualCents / 12))}/mo billed annually`
                  : ""}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-stone-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    {f}
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
      </div>
    </>
  );
}
