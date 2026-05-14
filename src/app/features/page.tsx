import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Smartphone,
  Palette,
  Globe,
  Mail,
  QrCode,
  Sparkles,
  Check,
  Coffee,
  BarChart3,
  Languages,
  Tag,
  Lock,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import FeaturesCardCarousel from "@/components/features-card-carousel";
import { patterns } from "@/lib/patterns";

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
      "No customer app. Free card customisation. 13 languages. Real-time approval. CSV export. One $5/mo plan — no feature gating.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&h=630&q=70&auto=format&fit=crop",
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
      "No customer app. Free card customisation. 13 languages. One $5/mo plan.",
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

// Compact preview swatches for the card-design section.
const HUE_SWATCHES: Array<{ name: string; hex: string }> = [
  { name: "red", hex: "#dc2626" },
  { name: "orange", hex: "#ea580c" },
  { name: "amber", hex: "#d97706" },
  { name: "yellow", hex: "#ca8a04" },
  { name: "lime", hex: "#65a30d" },
  { name: "green", hex: "#16a34a" },
  { name: "emerald", hex: "#059669" },
  { name: "teal", hex: "#0d9488" },
  { name: "cyan", hex: "#0891b2" },
  { name: "sky", hex: "#0284c7" },
  { name: "blue", hex: "#2563eb" },
  { name: "indigo", hex: "#4f46e5" },
  { name: "violet", hex: "#7c3aed" },
  { name: "purple", hex: "#9333ea" },
  { name: "fuchsia", hex: "#c026d3" },
  { name: "pink", hex: "#db2777" },
  { name: "rose", hex: "#e11d48" },
  { name: "stone", hex: "#57534e" },
];

const PATTERN_SWATCHES = patterns.slice(0, 8); // first eight for visual variety

// Comparison-style features table grouped by category.
const FEATURE_TABLE: Array<{
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: Array<{ label: string; free: string | true; pro: string | true }>;
}> = [
  {
    category: "For your customers",
    icon: Smartphone,
    rows: [
      { label: "No app to download — opens in any phone browser", free: true, pro: true },
      { label: "Stamps follow them across devices (optional login)", free: true, pro: true },
      { label: "Switch shop UI for customers at multiple cafes", free: true, pro: true },
      { label: "Customer-facing language auto-translates", free: true, pro: true },
      { label: "Customer can edit their own name / email / password", free: true, pro: true },
    ],
  },
  {
    category: "Card design",
    icon: Palette,
    rows: [
      { label: "Background & foreground colour (198 combinations)", free: true, pro: true },
      { label: "36 background patterns", free: true, pro: true },
      { label: "Logo upload (or auto-generated brand banner)", free: true, pro: true },
      { label: "Live preview while you customise", free: true, pro: true },
      { label: "Auto-applies to the printable QR PDF", free: true, pro: true },
    ],
  },
  {
    category: "For you (the cafe)",
    icon: Coffee,
    rows: [
      { label: "Real-time stamp approval (no separate stamper app)", free: true, pro: true },
      { label: "Branded printable QR code PDF", free: true, pro: true },
      { label: "Customer list with notes + tags", free: true, pro: true },
      { label: "Configurable reward threshold (1–20 stamps)", free: true, pro: true },
      { label: "Customer detail page with stamp history", free: true, pro: true },
    ],
  },
  {
    category: "Analytics & data",
    icon: BarChart3,
    rows: [
      { label: "Live dashboard — stamps, customers, redeems", free: true, pro: true },
      { label: "Date-range filter (today / week / month / custom)", free: true, pro: true },
      { label: "Daily activity chart", free: true, pro: true },
      { label: "CSV export of customers", free: true, pro: true },
    ],
  },
  {
    category: "Lifecycle & messaging",
    icon: Mail,
    rows: [
      { label: "Welcome email to customer on first stamp", free: true, pro: true },
      { label: "Drip emails to you during activation", free: true, pro: true },
      { label: "Automatic upgrade nudge when nearing free-tier cap", free: true, pro: true },
      { label: "13 languages — Arabic (RTL), Mandarin, Japanese, etc.", free: true, pro: true },
    ],
  },
  {
    category: "Pricing & plan",
    icon: Tag,
    rows: [
      { label: "Stamps included", free: "100 lifetime", pro: "Unlimited" },
      { label: "Price", free: "$0", pro: "$5/month" },
      { label: "Credit card required", free: "No", pro: "Yes (Stripe)" },
      { label: "Feature gating", free: "None", pro: "None" },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader transparent />

      {/* ───────── HERO ───────── */}
      <section className="relative min-h-[70vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1600&q=70&auto=format&fit=crop"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/70 to-stone-900/90" />
        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Everything included on every plan
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            A loyalty card you&apos;d actually want at your cafe.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-200 md:text-xl">
            No app to download. No premium-tier gating. Just a QR code at the
            counter and a card that opens in any phone browser — fully branded,
            in 13 languages.
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
        {/* ───────── AT A GLANCE — 3 punchy cards ───────── */}
        <section className="border-b border-stone-200 bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Smartphone,
                  title: "No app for customers",
                  body:
                    "Card opens in &lt;1 second from a QR scan. No app store, no install, no account.",
                },
                {
                  icon: Languages,
                  title: "13 languages, same card",
                  body:
                    "Flip a setting and the customer card + printable QR PDF auto-translate. Arabic includes proper RTL.",
                },
                {
                  icon: Lock,
                  title: "No feature gating",
                  body:
                    "Free and Pro share every feature. The only difference is the stamps quota.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Icon className="size-5 text-amber-700" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-stone-900">
                    {title}
                  </h3>
                  <p
                    className="mt-2 text-base leading-relaxed text-stone-600"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── THE CARD ITSELF — live CardPreview ───────── */}
        <section className="border-b border-stone-200 bg-stone-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                  The customer card
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
                  Built for coffee. Works for any shop.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-stone-600">
                  Brewstamp was made for cafes, but the card itself is
                  vertical-agnostic. The same QR-scan flow works just as well
                  for a bakery, a barber, a brewery, or a juice bar — bring
                  your own colours, threshold, and reward.
                </p>
                <ul className="mt-6 space-y-3 text-base text-stone-700">
                  {[
                    "Logo banner that auto-generates if no logo uploaded",
                    "Live progress bar + animated stamp drop on approval",
                    "Reward countdown personalised by customer name",
                    "Switch-shop list for customers at multiple shops",
                  ].map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-0.5 size-5 shrink-0 text-amber-700" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm italic text-stone-500">
                  → Watch the card auto-rotate through 5 example shops.
                </p>
              </div>
              {/* Auto-rotating CardPreview across 5 shop verticals */}
              <FeaturesCardCarousel />
            </div>
          </div>
        </section>

        {/* ───────── CARD DESIGN SWATCHES ───────── */}
        <section className="border-b border-stone-200 bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                Card design
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
                198 colour combinations. 36 patterns. Zero upcharge.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
                The full design system ships on every plan. Pick a hue, pick a
                shade, drop in a pattern, upload your logo. Live preview while
                you tweak.
              </p>
            </div>

            {/* Colour swatches */}
            <div className="mt-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Pick a colour
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {HUE_SWATCHES.map((c) => (
                  <span
                    key={c.name}
                    title={c.name}
                    className="size-9 rounded-md shadow-sm ring-1 ring-stone-200"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <span className="inline-flex size-9 items-center justify-center rounded-md bg-stone-100 text-xs text-stone-500">
                  +5
                </span>
              </div>
            </div>

            {/* Pattern swatches */}
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Pick a pattern
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {PATTERN_SWATCHES.map((p) => (
                  <span
                    key={p.key}
                    title={p.label}
                    className="size-14 rounded-lg ring-1 ring-stone-200"
                    style={{
                      backgroundColor: "#4f46e5",
                      backgroundImage: p.fn("#fbbf24", 0.35),
                    }}
                  />
                ))}
                <span className="inline-flex size-14 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-500">
                  +28
                </span>
              </div>
            </div>

            {/* Brand banner example */}
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Upload a logo (or skip — we&apos;ll make one)
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div
                  className="flex aspect-[3/1] w-full items-center justify-center rounded-2xl px-6 text-center shadow-sm"
                  style={{ backgroundColor: "#fbbf24" }}
                >
                  <span
                    className="text-xl font-bold leading-tight"
                    style={{ color: "#4f46e5" }}
                  >
                    Bay Brews
                  </span>
                </div>
                <div className="flex aspect-[3/1] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 px-6 text-center text-sm text-stone-500">
                  <QrCode className="size-5" />
                  Or upload your own (3:1 ratio)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FEATURES TABLE ───────── */}
        <section className="border-b border-stone-200 bg-stone-50 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                Everything you get
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
                Same feature set on Free and Pro.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
                The only difference between the tiers is the stamps quota.
                Everything else — design, languages, analytics, lifecycle —
                ships on both.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_5rem_5rem] items-center gap-4 border-b border-stone-200 bg-stone-100 px-6 py-3 sm:grid-cols-[1fr_7rem_7rem]">
                <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Feature
                </span>
                <span className="text-center text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Free
                </span>
                <span className="text-center text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Pro
                </span>
              </div>

              {FEATURE_TABLE.map(({ category, icon: Icon, rows }) => (
                <div key={category}>
                  <div className="grid grid-cols-[1fr_5rem_5rem] items-center gap-4 border-y border-stone-200 bg-amber-50/40 px-6 py-3 sm:grid-cols-[1fr_7rem_7rem]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                      <Icon className="size-4 text-amber-700" aria-hidden />
                      {category}
                    </div>
                    <span />
                    <span />
                  </div>
                  {rows.map(({ label, free, pro }) => (
                    <div
                      key={label}
                      className="grid grid-cols-[1fr_5rem_5rem] items-center gap-4 border-b border-stone-100 px-6 py-3 last:border-b-0 sm:grid-cols-[1fr_7rem_7rem]"
                    >
                      <span className="text-sm text-stone-700">{label}</span>
                      <span className="flex items-center justify-center text-sm text-stone-700">
                        {free === true ? (
                          <Check className="size-5 text-emerald-600" />
                        ) : (
                          <span className="text-xs font-medium text-stone-600">
                            {free}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center justify-center text-sm text-stone-700">
                        {pro === true ? (
                          <Check className="size-5 text-emerald-600" />
                        ) : (
                          <span className="text-xs font-medium text-stone-600">
                            {pro}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── LANGUAGES STRIP ───────── */}
        <section className="border-b border-stone-200 bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Globe className="size-6 text-amber-700" />
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
                13 languages, one QR code.
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

        {/* ───────── FINAL CTA ───────── */}
        <section className="bg-stone-50 py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="rounded-2xl border border-stone-200 bg-white p-10">
              <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">
                Set up your loyalty card in 2 minutes.
              </h2>
              <p className="mt-3 text-stone-500">
                Free up to 100 stamps. No credit card required. Live in any
                phone browser, in any language.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                  >
                    Set up your shop
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/alternatives">
                  <Button
                    size="lg"
                    variant="outline"
                    className="cursor-pointer border-stone-300 px-8 text-base"
                  >
                    See how we compare
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
