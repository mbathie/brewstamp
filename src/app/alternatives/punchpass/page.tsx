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
import RelatedGuides from "@/components/related-guides";
import Testimonials from "@/components/testimonials";

export const metadata: Metadata = {
  title: "PunchPass Alternative — Free Stamp Card",
  description:
    "Brewstamp is a free PunchPass alternative — transparent free tier (100 stamps), $7/mo flat after, and a public roadmap.",
  alternates: { canonical: "/alternatives/punchpass" },
  openGraph: {
    type: "website",
    url: "/alternatives/punchpass",
    title: "PunchPass Alternative — Brewstamp",
    description:
      "A PunchPass alternative with a free tier and transparent pricing. Free up to 100 stamps, $7/mo flat after.",
    images: [
      {
        url: "https://images.pexels.com/photos/4787613/pexels-photo-4787613.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Pour-over coffee being prepared",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PunchPass Alternative — Brewstamp",
    description:
      "A PunchPass alternative with a free tier. Free up to 100 stamps, $7/mo flat.",
    images: [
      "https://images.pexels.com/photos/4787613/pexels-photo-4787613.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "PunchPass Alternative — Brewstamp",
  description:
    "Brewstamp is a PunchPass alternative for independent cafes — a digital coffee loyalty card with a transparent free tier and flat $7/mo pricing.",
  url: "https://brewstamp.app/alternatives/punchpass",
  about: {
    "@type": "SoftwareApplication",
    name: "Brewstamp",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
};

export default function PunchPassAlternative() {
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
          src="https://images.pexels.com/photos/4787613/pexels-photo-4787613.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/75 via-stone-900/65 to-stone-900/85" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
              <Coffee className="h-3.5 w-3.5" />
              PunchPass alternative
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              The{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                PunchPass alternative
              </span>{" "}
              with a real free tier.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
              Both Brewstamp and PunchPass do the same core thing — a digital
              coffee loyalty card with no customer app. The differences are in
              the free tier, the pricing transparency, and the small details
              that matter when you&apos;re running a cafe.
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
                Real free tier
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Transparent pricing
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
            Brewstamp is a PunchPass alternative for cafes that want a digital
            stamp card with a real free tier and public pricing. Both products
            sit in the same simple-loyalty-for-cafes lane; the main
            differentiators are <strong>free-tier generosity</strong>,{" "}
            <strong>pricing transparency</strong>, and{" "}
            <strong>per-stamp merchant approval</strong>.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Brewstamp vs PunchPass
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              The honest comparison
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              Where each product&apos;s public website is unclear we&apos;ve
              marked the row &quot;Not stated.&quot; Last reviewed May 2026.
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
                    PunchPass
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {[
                  {
                    feature: "Customer app required",
                    brewstamp: { good: true, text: "No — runs in browser" },
                    punchpass: { good: true, text: "No — runs in browser" },
                  },
                  {
                    feature: "Free tier",
                    brewstamp: { good: true, text: "Yes — 100 stamps total" },
                    punchpass: { good: null, text: "Not publicly stated" },
                  },
                  {
                    feature: "Public pricing",
                    brewstamp: { good: true, text: "$7/mo flat" },
                    punchpass: { good: null, text: "Contact for pricing" },
                  },
                  {
                    feature: "Per-stamp merchant approval",
                    brewstamp: { good: true, text: "Yes — every stamp" },
                    punchpass: { good: null, text: "Not stated" },
                  },
                  {
                    feature: "Customisable rewards",
                    brewstamp: { good: true, text: "Free coffee, threshold" },
                    punchpass: { good: true, text: "Free coffee, % off, item" },
                  },
                  {
                    feature: "Real-time edits from phone",
                    brewstamp: { good: true, text: "Yes — admin dashboard" },
                    punchpass: { good: true, text: "Yes" },
                  },
                  {
                    feature: "Customer insights",
                    brewstamp: { good: true, text: "Visits, frequency, churn" },
                    punchpass: { good: true, text: "Visit data" },
                  },
                  {
                    feature: "Setup time",
                    brewstamp: { good: true, text: "Under 2 minutes" },
                    punchpass: { good: null, text: "Not stated" },
                  },
                ].map(({ feature, brewstamp, punchpass }) => (
                  <tr key={feature} className="bg-white">
                    <td className="px-4 py-4 font-medium text-stone-800">
                      {feature}
                    </td>
                    <ComparisonCell {...brewstamp} />
                    <ComparisonCell {...punchpass} />
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
              Reasons cafes pick Brewstamp over PunchPass
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: DollarSign,
                title: "A free tier you can actually run on",
                desc: "Brewstamp covers your first 100 stamps for free — enough volume to genuinely test whether a loyalty program works for your shop. Not a 7-day trial, not a credit-card-required free tier.",
              },
              {
                icon: Eye,
                title: "Pricing on the website",
                desc: "We list our $7/mo price publicly. No demo call required, no email gate, no quoted price that changes by region. What you see is what you pay.",
              },
              {
                icon: Shield,
                title: "Per-stamp merchant approval",
                desc: "Every Brewstamp stamp pops up on your dashboard for approval before it lands on the customer's card. No way to self-stamp by re-scanning the code while no one's watching.",
              },
              {
                icon: Zap,
                title: "Live in 2 minutes",
                desc: "Create your shop, customise the card, print the QR code. The whole flow is built so you can be running stamps before your next coffee is brewed.",
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

      {/* When PunchPass is better */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
            When PunchPass might be the better fit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            We&apos;re not for everyone
          </h2>
          <p className="mt-4 text-stone-500">
            Both products are simple cafe loyalty tools and the gap between
            them is narrower than the comparison vs enterprise platforms. A
            couple of honest scenarios where PunchPass might fit better:
          </p>
          <ul className="mt-8 space-y-5">
            {[
              {
                bold: "You want richer reward options out of the box.",
                text: "PunchPass advertises rewards beyond free coffee — % discounts, free pastries, free smoothies. Brewstamp keeps the reward focused on the most-effective option (free coffee at a threshold) but is less configurable.",
              },
              {
                bold: "You like the PunchPass UI better.",
                text: "Both products are simple — pick whichever dashboard you actually enjoy looking at every morning. Try Brewstamp's free tier and see.",
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
              Free up to 100 stamps. $7/mo flat after. No demos, no calls.
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
              PunchPass alternative — questions cafe owners ask
            </h2>
          </div>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "Is Brewstamp a free PunchPass alternative?",
                a: "Yes — Brewstamp has a public free tier covering your first 100 stamps total. After that it's $7/mo for unlimited stamps. PunchPass doesn't publicly list a free tier on its site at the time of writing.",
              },
              {
                q: "How is Brewstamp different from PunchPass?",
                a: "Both are simple, app-less digital loyalty tools for cafes — that's the same lane. The visible differences are: Brewstamp lists pricing publicly, has a 100-stamp free tier, and requires per-stamp merchant approval (so customers can't self-stamp).",
              },
              {
                q: "Can I switch from PunchPass to Brewstamp?",
                a: "Yes. There's no automated migration tool, but because neither product requires a customer app, your regulars can switch by scanning your new Brewstamp QR code on their next visit. Run both for a couple of weeks.",
              },
              {
                q: "Which is cheaper, Brewstamp or PunchPass?",
                a: "Brewstamp publishes its pricing — free up to 100 stamps, then $7/mo. PunchPass doesn't list a public price; you'd need to contact them for a quote.",
              },
              {
                q: "Is PunchPass a good loyalty app?",
                a: "PunchPass is a legitimate, simple cafe loyalty tool. If you've used it and it works, you don't need to switch. But if you want a free tier and visible pricing, Brewstamp is purpose-built for that.",
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
            Try the free PunchPass alternative
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-300">
            Set up takes less than 2 minutes. Free up to 100 stamps total. No
            credit card.
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

      <RelatedGuides />

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
