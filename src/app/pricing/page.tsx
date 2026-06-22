import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import PlanCards from "./plan-cards";

export const metadata: Metadata = {
  title: "Pricing — Free, Pro, Plus, Max plans",
  description:
    "Brewstamp pricing for cafes and small businesses. Free for your first 100 stamps. Paid plans from $7/month with unlimited stamps, multi-shop, staff logins, CSV exports, and corporate perk mode for subsidised staff coffee.",
  alternates: { canonical: "/pricing" },
};

interface Plan {
  name: string;
  tagline: string;
  price: string;
  highlight?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "Try it out",
    price: "$0",
    features: [
      "Up to 100 stamps total",
      "1 shop",
      "QR codes & real-time approvals",
      "Customer dashboard",
    ],
  },
  {
    name: "Pro",
    tagline: "For a single busy shop",
    price: "$7",
    features: [
      "Unlimited stamps",
      "1 shop",
      "Apple & Google Wallet passes",
      "Customer insights & analytics",
      "Priority support",
    ],
  },
  {
    name: "Plus",
    tagline: "Growing brands",
    price: "$19",
    highlight: true,
    features: [
      "Everything in Pro",
      "Up to 3 shops",
      "Unlimited staff logins",
      "CSV customer exports",
      "Cross-shop reporting",
      "Corporate perk mode",
    ],
  },
  {
    name: "Max",
    tagline: "Multi-location chains",
    price: "$29",
    features: [
      "Everything in Plus",
      "Up to 10 shops",
      "Cross-shop reporting",
      "Priority + dedicated support",
    ],
  },
];

interface FeatureRow {
  label: string;
  free: string | boolean;
  starter: string | boolean;
  roast: string | boolean;
  reserve: string | boolean;
}

const FEATURES: FeatureRow[] = [
  { label: "Shops", free: "1", starter: "1", roast: "Up to 3", reserve: "Up to 10" },
  { label: "Stamps issued per month", free: "100 total", starter: "Unlimited", roast: "Unlimited", reserve: "Unlimited" },
  { label: "Real-time stamp approvals", free: true, starter: true, roast: true, reserve: true },
  { label: "Custom logo, colours, patterns", free: true, starter: true, roast: true, reserve: true },
  { label: "Customer dashboard", free: true, starter: true, roast: true, reserve: true },
  { label: "Customer insights & analytics", free: false, starter: true, roast: true, reserve: true },
  { label: "Apple & Google Wallet passes", free: false, starter: true, roast: true, reserve: true },
  { label: "Staff & manager logins", free: false, starter: false, roast: "Unlimited", reserve: "Unlimited" },
  { label: "CSV customer exports", free: false, starter: false, roast: true, reserve: true },
  { label: "Cross-shop rollup reporting", free: false, starter: false, roast: true, reserve: true },
  { label: "Corporate perk mode (subsidised staff coffee)", free: false, starter: false, roast: true, reserve: true },
  { label: "Email support", free: true, starter: true, roast: true, reserve: true },
  { label: "Priority support", free: false, starter: true, roast: true, reserve: true },
  { label: "Dedicated account support", free: false, starter: false, roast: false, reserve: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (value === false) {
    return <Minus className="inline h-4 w-4 text-stone-300" />;
  }
  return <span className="text-sm text-stone-700">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PublicHeader />
      <main className="bg-white">
        {/* Hero */}
        <section className="bg-stone-50 px-6 pt-24 pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Pricing
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
              Pick the plan that fits your shop
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-500">
              Start free — your first 100 stamps are on us. Upgrade as your
              shop, your team, or your number of locations grows. No
              setup fees, cancel anytime.
            </p>
          </div>
        </section>

        {/* Plan cards */}
        <section className="bg-stone-50 px-6 pb-20">
          <PlanCards />
        </section>

        {/* Feature comparison */}
        <section className="border-t border-stone-200 bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
                Compare every plan, side by side
              </h2>
              <p className="mt-3 text-stone-500">
                Same product. The right size for where your shop is today.
              </p>
            </div>

            <div className="mt-10 overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-sm">
                    <th className="px-5 py-4 font-semibold text-stone-900">
                      Feature
                    </th>
                    {PLANS.map((p) => (
                      <th
                        key={p.name}
                        className={`px-5 py-4 text-center font-semibold ${
                          p.highlight ? "text-amber-700" : "text-stone-900"
                        }`}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((row, i) => (
                    <tr
                      key={row.label}
                      className={
                        i % 2 === 0 ? "bg-white" : "bg-stone-50/60"
                      }
                    >
                      <td className="px-5 py-3.5 text-sm text-stone-700">
                        {row.label}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Cell value={row.free} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Cell value={row.starter} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Cell value={row.roast} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Cell value={row.reserve} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 text-center">
              <Link href="/register">
                <Button className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800">
                  Get started free
                </Button>
              </Link>
              <p className="mt-3 text-xs text-stone-500">
                No credit card required. Upgrade when your loyalty program is taking off.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ link block */}
        <section className="border-t border-stone-200 bg-stone-50 px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xl font-semibold text-stone-900">
              Questions about a plan?
            </h2>
            <p className="mt-2 text-stone-500">
              See the{" "}
              <Link href="/#faq" className="text-amber-700 hover:underline">
                FAQ on the home page
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="text-amber-700 hover:underline">
                get in touch
              </Link>
              . We&apos;re a small team — you&apos;ll hear back from a real person.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
