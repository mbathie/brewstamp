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
  title: "Loyverse Loyalty Alternative — No Customer App",
  description:
    "Brewstamp is a Loyverse Loyalty alternative for cafes that don't want their customers to install a POS app. Free to 100 stamps, $5/month flat after.",
  alternates: { canonical: "/alternatives/loyverse" },
  openGraph: {
    type: "website",
    url: "/alternatives/loyverse",
    title: "Loyverse Loyalty Alternative — Brewstamp",
    description:
      "A Loyverse Loyalty alternative for cafes whose customers don't want to install another POS-tied app. Free up to 100 stamps, $5/month flat.",
    images: [
      {
        url: "https://images.pexels.com/photos/1437318/pexels-photo-1437318.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Cafe counter with morning light",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loyverse Loyalty Alternative — Brewstamp",
    description:
      "A Loyverse Loyalty alternative your customers don't have to download. Free to 100 stamps, $5/month flat.",
    images: [
      "https://images.pexels.com/photos/1437318/pexels-photo-1437318.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Loyverse Loyalty Alternative — Brewstamp",
  description:
    "Brewstamp is a Loyverse Loyalty alternative for cafes — a digital coffee loyalty card that doesn't require customers to install a POS app.",
  url: "https://brewstamp.app/alternatives/loyverse",
  about: {
    "@type": "SoftwareApplication",
    name: "Brewstamp",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
};

export default function LoyverseAlternative() {
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
          src="https://images.pexels.com/photos/1437318/pexels-photo-1437318.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/75 via-stone-900/65 to-stone-900/85" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
              <Coffee className="h-3.5 w-3.5" />
              Loyverse Loyalty alternative
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              The{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Loyverse Loyalty alternative
              </span>{" "}
              your customers don&apos;t have to install.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
              Loyverse&apos;s loyalty program is solid if you&apos;re running
              their POS — but it asks customers to download the Loyverse
              customer app. Brewstamp keeps the loyalty card in the browser:
              one QR code at the counter, no install, no account creation.
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
                No customer app
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Works with any POS
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
            Loyverse Loyalty is the loyalty feature inside Loyverse POS. Both
            it and Brewstamp keep loyalty simple, but Loyverse expects your
            customers to install the Loyverse customer app to track their
            stamps. Brewstamp does the same job{" "}
            <strong>with no app at all</strong> — the card lives at a URL the
            customer scans into. The other big differences:{" "}
            <strong>POS independence</strong> and a{" "}
            <strong>flat $5/month price</strong> (vs Loyverse&apos;s
            paid POS add-ons for advanced features).
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Brewstamp vs Loyverse Loyalty
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              The honest comparison
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              Pricing and features pulled from the Loyverse public website.
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
                    Loyverse Loyalty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {[
                  {
                    feature: "Customer app required",
                    brewstamp: { good: true, text: "No — runs in browser" },
                    loyverse: { good: false, text: "Yes — Loyverse customer app" },
                  },
                  {
                    feature: "Requires specific POS",
                    brewstamp: { good: true, text: "No — works alongside any POS" },
                    loyverse: { good: false, text: "Yes — Loyverse POS" },
                  },
                  {
                    feature: "Free tier",
                    brewstamp: { good: true, text: "Yes — 100 stamps total" },
                    loyverse: { good: true, text: "Free with Loyverse POS basics" },
                  },
                  {
                    feature: "Public pricing",
                    brewstamp: { good: true, text: "$5/month flat (after free tier)" },
                    loyverse: { good: null, text: "Free + paid add-ons (per outlet)" },
                  },
                  {
                    feature: "Per-stamp merchant approval",
                    brewstamp: { good: true, text: "Yes — every stamp" },
                    loyverse: { good: null, text: "Tied to a Loyverse sale" },
                  },
                  {
                    feature: "Customisable rewards",
                    brewstamp: { good: true, text: "Free coffee, threshold" },
                    loyverse: { good: true, text: "Points-based, multiple tiers" },
                  },
                  {
                    feature: "Customer insights",
                    brewstamp: { good: true, text: "Visits, frequency, churn" },
                    loyverse: { good: true, text: "Sales-based reports" },
                  },
                  {
                    feature: "Setup time",
                    brewstamp: { good: true, text: "Under 2 minutes" },
                    loyverse: { good: null, text: "Requires Loyverse account + POS setup" },
                  },
                ].map(({ feature, brewstamp, loyverse }) => (
                  <tr key={feature} className="bg-white">
                    <td className="px-4 py-4 font-medium text-stone-800">
                      {feature}
                    </td>
                    <ComparisonCell {...brewstamp} />
                    <ComparisonCell {...loyverse} />
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
              Reasons cafes pick Brewstamp over Loyverse Loyalty
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Shield,
                title: "Your customers don't install anything",
                desc: "Loyverse's loyalty program runs through the Loyverse customer app — another download you're asking your regulars to bother with. Brewstamp's card opens in their browser. No app, no account, no friction.",
              },
              {
                icon: Zap,
                title: "Independent of your POS",
                desc: "If you switch from Loyverse POS to anything else (Square, Toast, plain card terminal), your Loyverse loyalty data goes with the POS. Brewstamp stays put — your stamp card is its own thing.",
              },
              {
                icon: DollarSign,
                title: "One flat price",
                desc: "Loyverse's loyalty basics are free, but real reporting and multi-outlet support sit behind paid Loyverse add-ons charged per outlet per month. Brewstamp is $5/month flat. No add-ons. No surprises.",
              },
              {
                icon: Eye,
                title: "Per-stamp approval kills self-stamping",
                desc: "Every Brewstamp stamp shows up on your dashboard for approval before it lands. Loyverse's sale-tied stamping is hard to game, but Brewstamp's flow protects you even if loyalty is decoupled from purchases.",
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

      {/* When Loyverse is better */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
            When Loyverse Loyalty might be the better fit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            We&apos;re not for everyone
          </h2>
          <p className="mt-4 text-stone-500">
            Loyverse is a competent free POS with a real ecosystem. A few
            scenarios where its loyalty feature is the right call:
          </p>
          <ul className="mt-8 space-y-5">
            {[
              {
                bold: "You already run Loyverse POS day-to-day.",
                text: "Loyverse Loyalty is included in the basic POS, so if you're already a Loyverse shop the cheapest option is the one you already have. The trade-off is the customer-app requirement.",
              },
              {
                bold: "You want loyalty tied to dollar spend, not visits.",
                text: "Loyverse runs a points-per-dollar system. Brewstamp runs a stamp-per-visit system. If your average ticket varies a lot — coffee plus pastry plus brunch — points may map to your business better.",
              },
              {
                bold: "You have multiple outlets sharing one customer base.",
                text: "Loyverse handles multi-location loyalty natively. Brewstamp's multi-shop story is simpler — better for independent cafes than chains.",
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
              Free up to 100 stamps. $5/month flat after. No customer app, no
              POS lock-in.
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
              Loyverse Loyalty alternative — questions cafe owners ask
            </h2>
          </div>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "Is Brewstamp a free Loyverse Loyalty alternative?",
                a: "Yes. Brewstamp is free up to 100 stamps total, then $5/month for unlimited stamps. Loyverse's basic loyalty feature is also free — but only when bundled with Loyverse POS, and customers need the Loyverse app.",
              },
              {
                q: "Do my customers need to download an app to use Brewstamp?",
                a: "No. Brewstamp opens in any phone browser. The customer scans your QR code, the loyalty card appears, and they collect stamps from there — no App Store, no install, no account creation.",
              },
              {
                q: "Do I need Loyverse POS to use Brewstamp?",
                a: "No. Brewstamp doesn't care which POS you run. It's a separate digital loyalty card that lives at a QR code on your counter, completely independent of your card terminal or sales system.",
              },
              {
                q: "How is Brewstamp different from Loyverse Loyalty?",
                a: "Loyverse ties loyalty to its own POS and customer app. Brewstamp is POS-agnostic and runs in the browser — no apps anywhere. The pricing model is also flatter: $5/month flat instead of free-but-with-paid-add-ons priced per outlet.",
              },
              {
                q: "Can I switch from Loyverse to Brewstamp?",
                a: "Yes. Print a new Brewstamp QR code, replace your existing loyalty signage, and ask regulars to scan it on their next visit. Because neither product needs a customer app for the new card to work, the switch is friction-free for them.",
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
            Try the Loyverse Loyalty alternative your customers don&apos;t have
            to install
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-300">
            Set up takes less than 2 minutes. No customer app. Free up to 100
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
