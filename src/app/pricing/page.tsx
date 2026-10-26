import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import PlanCards from "./plan-cards";
import { FREE_STAMPS, formatCents, type PlanCatalog, type PlanConfig } from "@/lib/plans";
import { getPlanCatalog } from "@/lib/plan-catalog";
import { PLAN_OFFERS, withPlanOffers } from "@/lib/structured-data";
import { pricingFaq } from "@/lib/pricing-faq";
import { SITE_URL } from "@/lib/site";

// Plans and prices come from the database; re-render at most every 5 minutes
// so a catalogue change shows without a deploy.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getPlanCatalog();
  const paid = catalog.publicPlans.filter((p) => p.slug !== "free");
  const names = catalog.publicPlans.map((p) => p.label);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names.at(-1)}` : names[0];
  const from = paid.length ? Math.min(...paid.map((p) => catalog.priceCents(p, "month"))) : 0;
  return {
    title: `Pricing — ${list} plans`,
    description: `Brewstamp pricing for cafes and small businesses. Free for your first ${FREE_STAMPS} stamps. Paid plans from ${formatCents(from)}/month: unlimited stamps, staff logins, multiple shops, CSV exports and corporate perk mode. Annual billing saves more.`,
    alternates: { canonical: "/pricing" },
  };
}

const count = (n: number | "unlimited", one: string) =>
  n === "unlimited" ? "Unlimited" : n === 0 ? false : n === 1 ? one : `Up to ${n}`;

// Comparison rows, each read off the plan's own limits and flags.
const FEATURES: Array<{ label: string; value: (p: PlanConfig) => string | boolean }> = [
  { label: "Shops", value: (p) => count(p.shopLimit, "1") },
  {
    label: "Stamps issued per month",
    value: (p) => (p.stampLimit === "unlimited" ? "Unlimited" : `${p.slug === "free" ? FREE_STAMPS : p.stampLimit} total`),
  },
  { label: "Real-time stamp approvals", value: () => true },
  { label: "Custom logo, colours, patterns", value: () => true },
  { label: "Customer dashboard", value: () => true },
  { label: "Customer insights & analytics", value: (p) => p.hasAnalytics },
  { label: "Apple & Google Wallet passes", value: (p) => p.hasWalletPasses },
  { label: "Staff & manager logins", value: (p) => count(p.staffLoginLimit, "1") },
  { label: "CSV customer exports", value: (p) => p.hasCsvExport },
  { label: "Cross-shop rollup reporting", value: (p) => p.hasCrossShopReporting },
  { label: "Corporate perk mode (subsidised staff coffee)", value: (p) => p.hasPerkMode },
  { label: "Email support", value: () => true },
  { label: "Priority support", value: (p) => p.prioritySupport },
  { label: "Dedicated account support", value: (p) => p.dedicatedSupport },
];

function visibleRows(catalog: PlanCatalog) {
  // Skip a row no offered plan has (e.g. dedicated support once Max retired).
  return FEATURES.filter((row) => catalog.publicPlans.some((p) => row.value(p) !== false));
}

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

export default async function PricingPage() {
  const catalog = await getPlanCatalog();
  const faq = pricingFaq(catalog);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Brewstamp",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        url: `${SITE_URL}/pricing`,
        description: "Digital coffee loyalty cards for cafes: customers scan a QR code to collect stamps, no app needed.",
        offers: PLAN_OFFERS,
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(withPlanOffers(jsonLd, catalog)) }}
      />
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
              Start free — your first {FREE_STAMPS}{" "}stamps are on us. Upgrade as your
              shop, your team, or your number of locations grows. No
              setup fees, cancel anytime.
            </p>
          </div>
        </section>

        {/* Plan cards */}
        <section className="bg-stone-50 px-6 pb-20">
          <PlanCards plans={catalog.publicPlans} />
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

            <div className="mx-auto mt-10 max-w-5xl overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-sm">
                    <th className="px-5 py-4 font-semibold text-stone-900">
                      Feature
                    </th>
                    {catalog.publicPlans.map((p) => (
                      <th
                        key={p.slug}
                        className={`px-5 py-4 text-center font-semibold ${
                          p.badge ? "text-amber-700" : "text-stone-900"
                        }`}
                      >
                        {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows(catalog).map((row, i) => (
                    <tr
                      key={row.label}
                      className={
                        i % 2 === 0 ? "bg-white" : "bg-stone-50/60"
                      }
                    >
                      <td className="px-5 py-3.5 text-sm text-stone-700">
                        {row.label}
                      </td>
                      {catalog.publicPlans.map((p) => (
                        <td key={p.slug} className="px-5 py-3.5 text-center">
                          <Cell value={row.value(p)} />
                        </td>
                      ))}
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

        {/* Pricing FAQ — mirrored in the FAQPage JSON-LD above */}
        <section id="faq" className="border-t border-stone-200 bg-white px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">Pricing questions</h2>
            <dl className="mt-10 divide-y divide-stone-200">
              {faq.map((f) => (
                <div key={f.q} className="py-5">
                  <dt className="font-semibold text-stone-900">{f.q}</dt>
                  <dd className="mt-2 text-stone-600">{f.a}</dd>
                </div>
              ))}
            </dl>
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
