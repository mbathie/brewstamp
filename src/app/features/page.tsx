import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Smartphone,
  Palette,
  Globe,
  Zap,
  Users,
  Download,
  Mail,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Features — A Coffee Loyalty Card Without the Bloat",
  description:
    "Everything Brewstamp does — no app for your customers, fully customisable card design (free), 13 languages, real-time stamp approval, CSV export, drip-email lifecycle, and a $5/mo Pro plan that doesn't gate features behind tiers.",
  alternates: { canonical: "/features" },
  openGraph: {
    type: "website",
    url: "/features",
    title: "Brewstamp Features — Coffee Loyalty Without the Bloat",
    description:
      "No customer app. Free card customisation. 13 languages. Real-time approval. CSV export. One simple $5/mo Pro plan — no feature gating.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=630&q=70&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Cafe counter with espresso machine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brewstamp Features — Coffee Loyalty Without the Bloat",
    description:
      "No customer app. Free card customisation. 13 languages. One simple $5/mo Pro plan.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Brewstamp",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://brewstamp.app",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free up to 100 stamps. $5/month for unlimited stamps.",
  },
  featureList: [
    "No app download for customers — opens in any phone browser",
    "13 languages including Arabic (RTL), Mandarin, Japanese, Korean, Hindi",
    "Fully customisable card design — colours, patterns, logo (free, not gated)",
    "Real-time stamp approval via the merchant dashboard",
    "Customer login so stamps follow them between devices",
    "Customer notes and tags",
    "CSV export of customer data",
    "Printable QR code PDF, branded with shop colours",
    "Drip lifecycle emails + first-stamp customer email",
    "Live activity dashboard with date-range filtering",
  ],
};

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-b from-stone-900 via-stone-800 to-stone-700 pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
            Features
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
            A coffee loyalty card without the bloat.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-300">
            No app for your customers to download. No customisation gated behind
            a premium tier. No separate &ldquo;stamper&rdquo; app for you to install.
            Just a QR code at the counter and a card that opens in any phone
            browser — instantly, in 13 languages, fully branded.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
              >
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/alternatives">
              <Button
                size="lg"
                variant="outline"
                className="cursor-pointer border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                Compare alternatives
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Customer experience */}
        <section className="border-b border-stone-200 bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                  For your customers
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                  Zero friction, no app required.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-stone-600">
                  Your customer scans the QR code at your counter. Their loyalty
                  card opens in their phone&apos;s browser in under a second.
                  They don&apos;t install anything. They don&apos;t create an
                  account. They tap once to request a stamp, you approve from
                  the dashboard, the stamp lands in real time.
                </p>
                <p className="mt-4 text-base leading-relaxed text-stone-600">
                  And next time they come back, the card remembers them.
                </p>
              </div>
              <ul className="space-y-4">
                {[
                  { icon: Smartphone, text: "Works on any iPhone or Android — no app store, no install" },
                  { icon: Zap, text: "Card opens in &lt;1 second from QR scan" },
                  { icon: ShieldCheck, text: "Card persists across visits; optional email/password to follow customer between devices" },
                  { icon: Globe, text: "Auto-translates into the customer&apos;s language (13 supported)" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
                    <span
                      className="text-base leading-relaxed text-stone-700"
                      dangerouslySetInnerHTML={{ __html: text }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Card design — the "free customisation" jab */}
        <section className="border-b border-stone-200 bg-stone-50 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                Card design
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                Fully customisable. On every plan.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
                Some competitors charge $25–$95/month and still cap you at
                &ldquo;1 card design&rdquo;. Brewstamp doesn&apos;t. Every shop —
                free or Pro — gets the full design system.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Palette,
                  title: "22 hues × 9 shades",
                  body: "Pick a background and foreground colour from the full Tailwind palette. Two-step picker with live preview.",
                },
                {
                  icon: Sparkles,
                  title: "36 background patterns",
                  body: "Topography, polka dots, hexagons, diagonal stripes, brick wall — pick a subtle texture or stay clean.",
                },
                {
                  icon: QrCode,
                  title: "Logo + brand banner",
                  body: "Upload a 3:1 logo, or auto-generate a coloured banner from your shop name. Drops straight onto the printed QR PDF too.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-stone-200 bg-white p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Icon className="size-5 text-amber-700" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-stone-900">{title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-stone-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Languages */}
        <section className="border-b border-stone-200 bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                Multilingual
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                13 languages, same QR code.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
                Set the customer-facing language in Shop Setup. The card, the
                buttons, the &ldquo;buy N, get one free&rdquo; headline on the
                printed PDF — everything switches. Arabic includes proper
                right-to-left layout.
              </p>
            </div>
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2 text-sm">
              {[
                "🇺🇸 English",
                "🇸🇦 العربية",
                "🇵🇭 Filipino",
                "🇫🇷 Français",
                "🇩🇪 Deutsch",
                "🇮🇳 हिन्दी",
                "🇮🇩 Bahasa Indonesia",
                "🇮🇹 Italiano",
                "🇯🇵 日本語",
                "🇰🇷 한국어",
                "🇨🇳 中文",
                "🇵🇹 Português",
                "🇪🇸 Español",
              ].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-stone-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Merchant workflow */}
        <section className="border-b border-stone-200 bg-stone-50 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-12 md:grid-cols-2 md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                  For you
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                  No separate &ldquo;stamper&rdquo; app to install.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-stone-600">
                  Your dashboard <em>is</em> the stamper. When a customer
                  requests a stamp, a modal appears in real time on whatever
                  device you have the dashboard open on — tablet, laptop, your
                  phone. Tap approve. Done. The stamp lands on their card
                  instantly via WebSocket.
                </p>
                <p className="mt-4 text-base leading-relaxed text-stone-600">
                  Setup takes 2 minutes. Print the QR code PDF (it&apos;s
                  branded with your colours and logo), stick it at the counter,
                  go.
                </p>
              </div>
              <ul className="space-y-4">
                {[
                  { icon: Zap, text: "Real-time stamp approval via dashboard (no separate stamper app)" },
                  { icon: QrCode, text: "Branded printable QR code PDF, one click to download" },
                  { icon: Users, text: "Customer list with notes, tags, and per-customer stamp history" },
                  { icon: Download, text: "CSV export of your customer data, any time" },
                  { icon: Mail, text: "Built-in lifecycle emails: first-stamp welcome to the customer, drip nudges to you" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
                    <span className="text-base leading-relaxed text-stone-700">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="border-b border-stone-200 bg-white py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
              One simple plan. No feature gating.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-600">
              Free up to your first 100 stamps. After that,{" "}
              <strong className="text-stone-900">$5/month</strong> for unlimited
              stamps. Everything on this page is included on both tiers —
              colours, patterns, languages, CSV export, lifecycle emails, the
              lot.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Set up your shop — it&apos;s free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
