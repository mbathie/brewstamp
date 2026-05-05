import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Coffee,
  Wallet,
  Zap,
  DollarSign,
  Layers,
  CheckCircle2,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import Testimonials from "@/components/testimonials";

export const metadata: Metadata = {
  title:
    "Loopy Loyalty Alternative: Brewstamp — Browser-Based Digital Stamp Card from $0",
  description:
    "Looking for a Loopy Loyalty alternative? Brewstamp is a browser-based digital stamp card with no Apple Wallet pass setup, free up to 100 stamps, and $5/month after — vs Loopy Loyalty's $25/month minimum.",
  alternates: { canonical: "/alternatives/loopy-loyalty" },
  openGraph: {
    type: "website",
    url: "/alternatives/loopy-loyalty",
    title: "Loopy Loyalty Alternative — Brewstamp",
    description:
      "A simpler, cheaper Loopy Loyalty alternative. Browser-based, free up to 100 stamps, and $5/month flat after.",
    images: [
      {
        url: "https://images.pexels.com/photos/30267627/pexels-photo-30267627.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Barista pouring coffee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loopy Loyalty Alternative — Brewstamp",
    description:
      "A simpler, cheaper Loopy Loyalty alternative. Browser-based, free to start.",
    images: [
      "https://images.pexels.com/photos/30267627/pexels-photo-30267627.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Loopy Loyalty Alternative — Brewstamp",
  description:
    "Brewstamp is a Loopy Loyalty alternative for independent cafes — a browser-based digital coffee loyalty card with no Apple Wallet setup, free up to 100 stamps, and flat $5/month pricing.",
  url: "https://brewstamp.app/alternatives/loopy-loyalty",
  about: {
    "@type": "SoftwareApplication",
    name: "Brewstamp",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
};

export default function LoopyLoyaltyAlternative() {
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
          src="https://images.pexels.com/photos/30267627/pexels-photo-30267627.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/75 via-stone-900/65 to-stone-900/85" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
              <Coffee className="h-3.5 w-3.5" />
              Loopy Loyalty alternative
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              The free{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Loopy Loyalty alternative
              </span>{" "}
              that runs in any browser.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
              Brewstamp gives you a digital coffee loyalty card without the
              Apple Wallet / Google Wallet pass workflow — and without the
              $25/month minimum. Customers scan a QR code, the card opens in
              their browser, you approve the stamp.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-600 px-8 text-base hover:bg-amber-700"
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
                No Wallet pass setup
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Free up to 100 stamps
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                $5/month flat
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
            Brewstamp is a Loopy Loyalty alternative for cafes that want a
            faster, browser-based digital stamp card. Both products skip the
            customer-app problem; the differences are in <strong>delivery
            mechanism</strong> (browser link vs Apple/Google Wallet pass),{" "}
            <strong>pricing</strong> (free tier vs $25/month minimum), and{" "}
            <strong>setup time</strong>.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Brewstamp vs Loopy Loyalty
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              The honest comparison
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              Pulled from each product&apos;s public pricing and feature pages.
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
                    Loopy Loyalty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {[
                  {
                    feature: "Customer app required",
                    brewstamp: { good: true, text: "No — runs in the browser" },
                    loopy: { good: true, text: "No — uses Apple/Google Wallet" },
                  },
                  {
                    feature: "Starting price",
                    brewstamp: { good: true, text: "Free up to 100 stamps" },
                    loopy: { good: false, text: "$25/month minimum" },
                  },
                  {
                    feature: "Card delivery",
                    brewstamp: { good: true, text: "Web link, instant" },
                    loopy: { good: null, text: "Wallet pass install" },
                  },
                  {
                    feature: "Apple/Google Wallet",
                    brewstamp: { good: false, text: "Not yet" },
                    loopy: { good: true, text: "Native Wallet passes" },
                  },
                  {
                    feature: "Max stamps per card",
                    brewstamp: { good: null, text: "Configurable" },
                    loopy: { good: true, text: "Up to 30" },
                  },
                  {
                    feature: "Real-time merchant approval",
                    brewstamp: { good: true, text: "Yes — every stamp" },
                    loopy: { good: true, text: "Stamper app" },
                  },
                  {
                    feature: "Multi-merchant programs",
                    brewstamp: { good: false, text: "Single-shop focus" },
                    loopy: { good: true, text: "Yes" },
                  },
                  {
                    feature: "Setup time",
                    brewstamp: { good: true, text: "Under 2 minutes" },
                    loopy: { good: null, text: "Card design + pass setup" },
                  },
                ].map(({ feature, brewstamp, loopy }) => (
                  <tr key={feature} className="bg-white">
                    <td className="px-4 py-4 font-medium text-stone-800">
                      {feature}
                    </td>
                    <ComparisonCell {...brewstamp} />
                    <ComparisonCell {...loopy} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why switch */}
      <section className="border-y border-stone-200 bg-stone-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Why cafes switch
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Reasons cafes choose Brewstamp over Loopy Loyalty
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: DollarSign,
                title: "Free to start, $5/month flat after",
                desc: "Loopy Loyalty's lowest plan is $25/month. Brewstamp covers your first 100 stamps for free, then $5/month for unlimited stamps. For most independent cafes, that's the difference between trying it and not.",
              },
              {
                icon: Zap,
                title: "Web link beats Wallet-pass install",
                desc: "Loopy delivers cards as Apple Wallet / Google Wallet passes — neat, but every customer has to tap through an OS-level install dialog. Brewstamp opens the card in the browser instantly. Faster for the customer, fewer drop-offs.",
              },
              {
                icon: Coffee,
                title: "One-shop simplicity",
                desc: "Loopy's strength is multi-merchant programs and configurable card mechanics. If you run one cafe and just want stamps-and-redeem, Brewstamp removes the configuration overhead.",
              },
              {
                icon: Layers,
                title: "Less to manage",
                desc: "No card-design tool to learn, no pass templates to maintain, no Wallet developer concepts. Print one QR code, run one program.",
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

      {/* When the competitor is better */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
            When Loopy Loyalty might be the better fit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            We&apos;re not for everyone
          </h2>
          <p className="mt-4 text-stone-500">
            Loopy Loyalty does some things Brewstamp doesn&apos;t — pick the
            tool that matches what you actually need:
          </p>
          <ul className="mt-8 space-y-5">
            {[
              {
                bold: "You want Apple Wallet / Google Wallet integration.",
                text: "Loopy's whole architecture is built around Wallet passes. If you want your loyalty card sitting next to your customers' boarding passes and credit cards, Loopy nails that — Brewstamp doesn't ship Wallet passes (yet).",
              },
              {
                bold: "You're running a multi-merchant program.",
                text: "Loopy supports loyalty programs that span multiple businesses (e.g. a precinct loyalty card across several cafes). Brewstamp is designed for a single shop.",
              },
              {
                bold: "You want highly configurable card mechanics.",
                text: "Loopy lets you set up to 30 stamps, custom card art, and rich card design. If your loyalty design sense is opinionated, Loopy gives you more knobs.",
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
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              One-fifth the price of Loopy Loyalty
            </h2>
            <p className="mx-auto mt-4 max-w-md text-stone-500">
              No tiered features locked behind enterprise plans. One simple
              price, all features.
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
                  No Wallet pass setup
                </li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="mt-8 w-full cursor-pointer">
                  Get started
                </Button>
              </Link>
            </div>
            <div className="relative rounded-2xl border-2 border-amber-600 bg-white p-8">
              <div className="absolute -top-3 right-6 rounded-full bg-amber-600 px-3 py-0.5 text-xs font-medium text-white">
                vs $25 on Loopy Loyalty
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
                <Button className="mt-8 w-full cursor-pointer bg-amber-600 hover:bg-amber-700">
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
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Loopy Loyalty alternative — questions cafe owners ask
            </h2>
          </div>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "Is Brewstamp a free Loopy Loyalty alternative?",
                a: "Yes — Brewstamp is free for your first 100 stamps total, then $5/month for unlimited stamps. Loopy Loyalty's lowest plan is $25/month with a free trial.",
              },
              {
                q: "Does Brewstamp support Apple Wallet and Google Wallet?",
                a: "Not yet. This is one of the genuine differences between the two products. Loopy's architecture is Wallet-pass-first; Brewstamp delivers the loyalty card as a web page that opens when the customer scans your QR code. If Wallet integration is a hard requirement, Loopy is the better choice today.",
              },
              {
                q: "How is Brewstamp different from Loopy Loyalty?",
                a: "Both skip the customer-app problem, but they solve it differently: Loopy uses Apple/Google Wallet passes; Brewstamp opens the card in a browser. Brewstamp is cheaper to start (free vs $25/month), simpler to set up, and aimed at independent single-location cafes rather than multi-merchant programs.",
              },
              {
                q: "Can I migrate my Loopy Loyalty customers to Brewstamp?",
                a: "There's no automated migration path. Because Brewstamp doesn't require any install, your regulars can move over by scanning your new Brewstamp QR code on their next visit. Run both for a few weeks.",
              },
              {
                q: "Is Loopy Loyalty good?",
                a: "Yes — Loopy is a mature, well-reviewed product with strong Apple/Google Wallet support and multi-merchant capability. For some cafes it's the right choice. Brewstamp targets the cafes that want something cheaper and simpler.",
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
            Try the free Loopy Loyalty alternative
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-300">
            Set up takes less than 2 minutes. Free up to 100 stamps. No
            Wallet-pass setup, no credit card.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-600 px-10 text-base hover:bg-amber-700"
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
