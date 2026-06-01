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
  title: "Square Loyalty Alternative — Free Digital Stamp Card",
  description:
    "Brewstamp is a free Square Loyalty alternative — no Square POS lock-in, transparent free tier (100 stamps), and $7/mo flat after.",
  alternates: { canonical: "/alternatives/square-loyalty" },
  openGraph: {
    type: "website",
    url: "/alternatives/square-loyalty",
    title: "Square Loyalty Alternative — Brewstamp",
    description:
      "A Square Loyalty alternative for cafes that aren't locked into Square POS. Free up to 100 stamps, $7/mo flat after.",
    images: [
      {
        url: "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Cafe counter with espresso machine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Square Loyalty Alternative — Brewstamp",
    description:
      "A Square Loyalty alternative without POS lock-in. Free up to 100 stamps, $7/mo flat.",
    images: [
      "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Square Loyalty Alternative — Brewstamp",
  description:
    "Brewstamp is a Square Loyalty alternative for cafes — a digital coffee loyalty card with no POS lock-in, a free tier, and flat $7/mo pricing.",
  url: "https://brewstamp.app/alternatives/square-loyalty",
  about: {
    "@type": "SoftwareApplication",
    name: "Brewstamp",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
};

export default function SquareLoyaltyAlternative() {
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
          src="https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/75 via-stone-900/65 to-stone-900/85" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
              <Coffee className="h-3.5 w-3.5" />
              Square Loyalty alternative
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              The{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Square Loyalty alternative
              </span>{" "}
              that isn&apos;t tied to a POS.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
              Square Loyalty is a strong loyalty product if you&apos;re already
              running Square POS. If you&apos;re not — or you don&apos;t want
              your loyalty program tied to your card terminal — Brewstamp is the
              standalone, browser-based alternative. Free up to 100 stamps. From
              $7/mo after.
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
                No POS required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Real free tier
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
            Square Loyalty is a paid add-on that lives inside Square POS. If
            you&apos;re not running Square — or you want a loyalty program that
            doesn&apos;t care which POS you use — Brewstamp is the
            POS-agnostic, browser-only alternative. The big differences are{" "}
            <strong>POS independence</strong>, <strong>price</strong>, and a{" "}
            <strong>real free tier</strong>.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Brewstamp vs Square Loyalty
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              The honest comparison
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              Pricing and features pulled from Square&apos;s public pricing
              page. Last reviewed May 2026.
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
                    Square Loyalty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {[
                  {
                    feature: "Requires specific POS",
                    brewstamp: { good: true, text: "No — works alongside any POS" },
                    square: { good: false, text: "Yes — Square POS required" },
                  },
                  {
                    feature: "Customer app required",
                    brewstamp: { good: true, text: "No — runs in browser" },
                    square: { good: null, text: "Square's customer app for stamping" },
                  },
                  {
                    feature: "Free tier",
                    brewstamp: { good: true, text: "Yes — 100 stamps total" },
                    square: { good: false, text: "No — paid add-on only" },
                  },
                  {
                    feature: "Starting monthly price",
                    brewstamp: { good: true, text: "$7/mo flat (after free tier)" },
                    square: { good: false, text: "$45/month + Square POS fees" },
                  },
                  {
                    feature: "Per-stamp merchant approval",
                    brewstamp: { good: true, text: "Yes — every stamp" },
                    square: { good: null, text: "Tied to a Square transaction" },
                  },
                  {
                    feature: "Customisable rewards",
                    brewstamp: { good: true, text: "Free coffee, threshold" },
                    square: { good: true, text: "Points, dollar discounts, items" },
                  },
                  {
                    feature: "Customer insights",
                    brewstamp: { good: true, text: "Visits, frequency, churn" },
                    square: { good: true, text: "Deep — tied to POS data" },
                  },
                  {
                    feature: "Setup time",
                    brewstamp: { good: true, text: "Under 2 minutes" },
                    square: { good: null, text: "Requires Square account + setup" },
                  },
                ].map(({ feature, brewstamp, square }) => (
                  <tr key={feature} className="bg-white">
                    <td className="px-4 py-4 font-medium text-stone-800">
                      {feature}
                    </td>
                    <ComparisonCell {...brewstamp} />
                    <ComparisonCell {...square} />
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
              Reasons cafes pick Brewstamp over Square Loyalty
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Zap,
                title: "Works with whatever POS you already have",
                desc: "Square POS is great. So is Toast. So is your old card reader. Brewstamp doesn't care — your loyalty program runs as a separate QR code at the counter, not as a POS plugin.",
              },
              {
                icon: DollarSign,
                title: "$7/mo vs $45/month",
                desc: "Square Loyalty starts at around $45/month on top of your Square processing fees. Brewstamp is $7/mo flat after a free tier of 100 stamps. For an independent cafe that's $480/year saved on a single line item.",
              },
              {
                icon: Eye,
                title: "A free tier you can really test",
                desc: "Brewstamp covers your first 100 stamps for free. That's enough volume to genuinely tell whether a loyalty program is shifting your numbers — without committing to another monthly subscription.",
              },
              {
                icon: Shield,
                title: "No customer app to install",
                desc: "Square's loyalty experience can require customers to use a Square-branded app or stored card. Brewstamp's card lives in the browser — scan the QR, get a card, no install, no account.",
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

      {/* When Square is better */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
            When Square Loyalty might be the better fit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            We&apos;re not for everyone
          </h2>
          <p className="mt-4 text-stone-500">
            Square Loyalty is genuinely good if it fits your existing setup. A
            few honest scenarios where it&apos;s the better choice:
          </p>
          <ul className="mt-8 space-y-5">
            {[
              {
                bold: "You already run Square POS, and want one bill.",
                text: "If your card payments, inventory, and reporting all live in Square, having loyalty there too is a real workflow win — even at the higher price.",
              },
              {
                bold: "You want loyalty tied to spend, not visits.",
                text: "Square Loyalty earns points based on dollars spent. Brewstamp earns stamps per visit. If your cafe has a wide product range with very different prices, points may fit better than stamps.",
              },
              {
                bold: "You have multiple reward tiers and a marketing team.",
                text: "Square Loyalty supports multi-tier rewards (free coffee + free pastry + free merch) and richer campaign tooling. Brewstamp deliberately keeps it simple.",
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
              Free up to 100 stamps. $7/mo flat after. No POS lock-in.
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
                <span className="text-4xl font-bold text-stone-900">$7</span>
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
          <div className="mt-10 text-center">
            <p className="text-sm text-stone-500">
              Need multi-shop, team logins, or CSV exports? Plus & Max
              plans go from $19–$29/mo.{" "}
              <a href="/pricing" className="font-medium text-amber-700 underline-offset-2 hover:underline">
                See full plan comparison →
              </a>
            </p>
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
              Square Loyalty alternative — questions cafe owners ask
            </h2>
          </div>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "Is Brewstamp a free Square Loyalty alternative?",
                a: "Yes. Brewstamp has a public free tier covering your first 100 stamps, then $7/mo for unlimited stamps. Square Loyalty is a paid Square add-on, typically around $45/month, with no free tier of its own.",
              },
              {
                q: "Do I need a specific POS to use Brewstamp?",
                a: "No. Brewstamp is a separate digital loyalty card that runs as a QR code at your counter — independent of whatever POS or card terminal you already use.",
              },
              {
                q: "How is Brewstamp different from Square Loyalty?",
                a: "Square Loyalty is a points-based program tightly coupled to Square POS purchases. Brewstamp is a stamp-based program that runs independently of any POS, lives in the browser, and prices at $7/mo flat instead of around $45.",
              },
              {
                q: "Can I use Brewstamp if I run Square POS?",
                a: "Yes. Brewstamp doesn't care which POS you use. Your customers scan the Brewstamp QR code separately from paying — the two systems just don't talk to each other, which is the entire point.",
              },
              {
                q: "Is Square Loyalty better for some cafes?",
                a: "Yes — if you already pay for Square POS and want everything on one bill, Square Loyalty's tighter integration is a real workflow benefit. The price difference is the trade-off.",
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
            Try the free Square Loyalty alternative
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-300">
            Set up takes less than 2 minutes. No POS required. Free up to 100
            stamps. No credit card.
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
