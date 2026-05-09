import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Coffee,
  DollarSign,
  Zap,
  Shield,
  Eye,
  CheckCircle2,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import Testimonials from "@/components/testimonials";

export const metadata: Metadata = {
  title: "Smile.io Alternative for Cafes — Stamp-Based Loyalty",
  description:
    "Brewstamp is a Smile.io alternative for in-store cafes — stamp-based, browser-only loyalty without the e-commerce overhead. Free to 100 stamps, $5/month flat after.",
  alternates: { canonical: "/alternatives/smile-io" },
  openGraph: {
    type: "website",
    url: "/alternatives/smile-io",
    title: "Smile.io Alternative for Cafes — Brewstamp",
    description:
      "A Smile.io alternative built for in-store cafes, not e-commerce stores. Free up to 100 stamps, $5/month flat.",
    images: [
      {
        url: "https://images.pexels.com/photos/1907227/pexels-photo-1907227.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Latte art on a flat white at a cafe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smile.io Alternative for Cafes — Brewstamp",
    description:
      "A Smile.io alternative for in-store cafe loyalty. Free to 100 stamps, $5/month flat.",
    images: [
      "https://images.pexels.com/photos/1907227/pexels-photo-1907227.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Smile.io Alternative for Cafes — Brewstamp",
  description:
    "Brewstamp is a Smile.io alternative for cafes — a stamp-based digital loyalty card built for in-person counters, not e-commerce stores.",
  url: "https://brewstamp.app/alternatives/smile-io",
  about: {
    "@type": "SoftwareApplication",
    name: "Brewstamp",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
};

export default function SmileIoAlternative() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader transparent />

      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1907227/pexels-photo-1907227.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/75 via-stone-900/65 to-stone-900/85" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
              <Coffee className="h-3.5 w-3.5" />
              Smile.io alternative for cafes
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              The{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Smile.io alternative
              </span>{" "}
              built for the counter, not the cart.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
              Smile.io is a great loyalty platform — for online stores. If
              you&apos;re a cafe trying to bolt it onto a counter, you end up
              paying e-commerce prices for a system that wasn&apos;t designed
              for stamping a card after someone buys a flat white. Brewstamp is
              the cafe-shaped alternative.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Try free up to 100 stamps
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#compare">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer border-white/20 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  See the comparison
                </Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Built for in-store
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                No store website needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Setup in 2 minutes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* In short */}
      <section className="border-y border-stone-200 bg-amber-50 py-12">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            In short
          </p>
          <p className="mt-2 text-lg leading-relaxed text-stone-700">
            Smile.io is the dominant e-commerce loyalty plugin — points,
            referrals, VIP tiers, all bolted onto a Shopify or BigCommerce
            store. If your cafe has an online store on top of the counter,
            Smile is genuinely powerful. If it&apos;s a counter and a card
            machine, you&apos;re paying for features you can&apos;t use.
            Brewstamp is{" "}
            <strong>stamp-based</strong>, runs from a{" "}
            <strong>QR code</strong>, and starts at{" "}
            <strong>$0/month</strong>.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Brewstamp vs Smile.io
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              The honest comparison
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              Pricing and features pulled from the Smile.io public website.
              Last reviewed May 2026.
            </p>
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100">
                <tr>
                  <th className="px-4 py-4 font-semibold text-stone-700">
                    Feature
                  </th>
                  <th className="px-4 py-4 font-semibold text-amber-700">
                    Brewstamp
                  </th>
                  <th className="px-4 py-4 font-semibold text-stone-700">
                    Smile.io
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {[
                  {
                    feature: "Built for in-store cafes",
                    brewstamp: { good: true, text: "Yes — counter-first" },
                    smile: { good: false, text: "No — e-commerce-first" },
                  },
                  {
                    feature: "Requires an e-commerce store",
                    brewstamp: { good: true, text: "No" },
                    smile: { good: false, text: "Yes (Shopify, BigCommerce, Wix)" },
                  },
                  {
                    feature: "Customer app required",
                    brewstamp: { good: true, text: "No — runs in browser" },
                    smile: { good: true, text: "No — browser widget" },
                  },
                  {
                    feature: "Free tier",
                    brewstamp: { good: true, text: "Yes — 100 stamps total" },
                    smile: { good: true, text: "Yes — capped order volume" },
                  },
                  {
                    feature: "Starting paid price",
                    brewstamp: { good: true, text: "$5/month flat" },
                    smile: { good: false, text: "$49+/month + e-commerce platform fees" },
                  },
                  {
                    feature: "Reward style",
                    brewstamp: { good: true, text: "Stamp per visit, free coffee threshold" },
                    smile: { good: true, text: "Points, tiers, referrals" },
                  },
                  {
                    feature: "In-store stamping flow",
                    brewstamp: { good: true, text: "Customer scans QR, you approve" },
                    smile: { good: false, text: "Not its core use case" },
                  },
                  {
                    feature: "Setup time",
                    brewstamp: { good: true, text: "Under 2 minutes" },
                    smile: { good: null, text: "Requires e-commerce store + integration" },
                  },
                ].map(({ feature, brewstamp, smile }) => (
                  <tr key={feature} className="bg-white">
                    <td className="px-4 py-4 font-medium text-stone-800">
                      {feature}
                    </td>
                    <ComparisonCell {...brewstamp} />
                    <ComparisonCell {...smile} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why choose Brewstamp */}
      <section className="border-y border-stone-200 bg-stone-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Why cafes choose Brewstamp
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Reasons cafes pick Brewstamp over Smile.io
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Zap,
                title: "Built for the counter, not the cart",
                desc: "Smile.io is a Shopify-shaped product. Brewstamp is a counter-shaped product. Customers scan a QR code while the barista is finishing their drink — no checkout flow, no order ID, no e-commerce stack.",
              },
              {
                icon: DollarSign,
                title: "$5/month vs $49/month",
                desc: "Smile.io's paid plans start at around $49/month and scale up fast based on order volume. Brewstamp is a flat $5/month after the free tier. For most cafes that's the difference between affordable and not worth it.",
              },
              {
                icon: Eye,
                title: "No website required",
                desc: "Smile.io needs an online store to live on. Brewstamp gives you the loyalty card as its own URL — print a QR code at the counter and you're done. No Shopify, no Wix, no developer required.",
              },
              {
                icon: Shield,
                title: "Per-stamp merchant approval",
                desc: "Brewstamp puts a stamp request on your dashboard before it lands on the customer's card. Useful when stamping isn't tied to a paid e-commerce checkout — it stops the customer from self-stamping while you're not looking.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-stone-200 bg-white p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Icon className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When Smile is better */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
            When Smile.io is the better fit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            We&apos;re not for everyone
          </h2>
          <p className="mt-4 text-stone-500">
            Smile.io is the right choice in plenty of cases — just not always
            for cafes:
          </p>
          <ul className="mt-8 space-y-5">
            {[
              {
                bold: "You sell coffee online and want loyalty across both channels.",
                text: "If you ship beans, sell merch, or run subscriptions through Shopify, Smile's points-based system is a natural fit there. You could even run Smile for the online store and Brewstamp for the counter — they happily coexist.",
              },
              {
                bold: "You want VIP tiers, referrals, and complex campaigns.",
                text: "Smile's whole edge is depth — multi-tier loyalty, referral programs, segmented campaigns. Brewstamp is intentionally one mechanic (stamps for free coffee), nothing more.",
              },
              {
                bold: "You're a multi-channel retailer, not a single-shop cafe.",
                text: "If 'cafe' is one of several lines of business, Smile is built for that. Brewstamp is built for one shop with a counter and a stamp card.",
              },
            ].map(({ bold, text }) => (
              <li
                key={bold}
                className="flex gap-3 text-base leading-relaxed text-stone-600"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>
                  <strong className="text-stone-800">{bold}</strong> {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Testimonials />

      {/* Pricing */}
      <section className="border-t border-stone-200 bg-stone-50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Public, simple, on the website
            </h2>
            <p className="mx-auto mt-4 max-w-md text-stone-500">
              Free up to 100 stamps. $5/month flat after. No e-commerce store
              required.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-stone-900">Free</h3>
              <p className="mt-1 text-sm text-stone-500">No credit card</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-stone-900">$0</span>
                <span className="text-stone-500"> /month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Up to 100 stamps total
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  All core features
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  No credit card required
                </li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="mt-8 w-full cursor-pointer">
                  Get started
                </Button>
              </Link>
            </div>
            <div className="relative rounded-2xl border-2 border-amber-600 bg-white p-8">
              <div className="absolute -top-3 right-6 rounded-full bg-amber-700 px-3 py-0.5 text-xs font-medium text-white">
                Most popular
              </div>
              <h3 className="text-lg font-semibold text-stone-900">Pro</h3>
              <p className="mt-1 text-sm text-stone-500">For busy shops</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-stone-900">$5</span>
                <span className="text-stone-500"> /month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Unlimited stamps
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Customer insights &amp; analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Priority support
                </li>
              </ul>
              <Link href="/register">
                <Button className="mt-8 w-full cursor-pointer bg-amber-700 hover:bg-amber-800">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Smile.io alternative — questions cafe owners ask
            </h2>
          </div>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "Is Brewstamp a free Smile.io alternative?",
                a: "Yes. Brewstamp is free for the first 100 stamps total, then $5/month for unlimited stamps. Smile.io has a free tier capped at low order volumes; paid plans start at around $49/month plus your underlying Shopify or BigCommerce subscription.",
              },
              {
                q: "Do I need a Shopify store to use Brewstamp?",
                a: "No. Brewstamp works without any e-commerce platform. You print a QR code, customers scan it from the counter, and the loyalty card lives at its own URL.",
              },
              {
                q: "How is Brewstamp different from Smile.io?",
                a: "Smile.io is built for online stores — points and tiers based on dollar spend in a Shopify-style checkout. Brewstamp is built for cafe counters — stamps per visit, redeemed at a threshold, all driven by a QR code at the till.",
              },
              {
                q: "Can I use Brewstamp alongside Smile.io?",
                a: "Yes. If you sell coffee beans online via Smile.io and pour coffee in person, the cleanest split is to keep Smile for the online store and run Brewstamp for the in-store stamp card. They don't conflict — they cover different parts of your business.",
              },
              {
                q: "Is Smile.io better for some cafes?",
                a: "If your business is mostly an online store with a small cafe attached — and you want unified loyalty across both — Smile.io is the right tool. Brewstamp is the right tool when the cafe is the business.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-stone-200 bg-stone-50 px-6 py-5"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-stone-900">
                  {q}
                  <span className="ml-4 text-stone-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1920&q=80&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/75" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Try the cafe-shaped Smile.io alternative
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-300">
            Set up takes less than 2 minutes. No e-commerce store required.
            Free up to 100 stamps. No credit card.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-700 px-10 text-base hover:bg-amber-800"
              >
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ComparisonCell({
  good,
  text,
}: {
  good: boolean | null;
  text: string;
}) {
  return (
    <td className="px-4 py-4 text-stone-600">
      <div className="flex items-start gap-2">
        {good === true && (
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        )}
        {good === false && (
          <X className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        )}
        {good === null && (
          <span className="mt-0.5 h-4 w-4 shrink-0 text-stone-400">—</span>
        )}
        <span>{text}</span>
      </div>
    </td>
  );
}
