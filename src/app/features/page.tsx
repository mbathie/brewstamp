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
  Users,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import FeaturesCardCarousel from "@/components/features-card-carousel";
import { patterns } from "@/lib/patterns";

export const metadata: Metadata = {
  title:
    "Features — Free Customisable Loyalty Card for Cafes, Bakeries, Barbers & More",
  description:
    "Every Brewstamp feature, listed: no-app QR loyalty card, 198 colour + 36 pattern combos, your logo on the card, 14 languages, real-time stamp approval, CSV export, drip-email lifecycle. Free up to 100 stamps, $7/mo unlimited — no premium tier gating.",
  alternates: { canonical: "/features" },
  keywords: [
    "loyalty card features",
    "coffee loyalty card no app",
    "QR code loyalty program",
    "customisable digital stamp card",
    "branded loyalty card",
    "cafe loyalty card design",
    "multi-language loyalty card",
    "no-app stamp card",
  ],
  openGraph: {
    type: "website",
    url: "/features",
    title: "Brewstamp Features — Free, Customisable, No App Required",
    description:
      "No-app QR loyalty card. 198 colour combos + 36 patterns + your logo. 14 languages. Real-time stamp approval. CSV export. One $7/mo plan — no feature gating.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&h=630&q=70&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Cafe counter with espresso machine — Brewstamp loyalty card features",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brewstamp Features — Free Customisable Loyalty Card",
    description:
      "No customer app. Branded card design free. 14 languages. One $7/mo plan, no feature gating.",
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
    description: "Free up to 100 stamps. $7/month for unlimited stamps.",
  },
  featureList: [
    "No app download for customers — opens in any phone browser",
    "14 languages including Arabic (RTL), Mandarin, Japanese, Korean, Hindi, Turkish",
    "Fully customisable card design — colours, patterns, logo (free, not gated)",
    "Real-time stamp approval via the merchant dashboard",
    "Customer login so stamps follow them between devices",
    "Customer notes and tags",
    "CSV export of customer data",
    "Printable QR code PDF, branded with shop colours",
    "Drip lifecycle emails + first-stamp customer email",
    "Live activity dashboard with date-range filtering",
    "Corporate perk mode — employer-subsidised staff coffee, capped per day and gated to work email domains",
  ],
};

// Compact preview swatches for the card-design section. All 22 Tailwind
// hues are shown — the headline calls out "22 hues × 9 shades = 198", so
// the visible swatch count needs to line up with the maths.
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
  { name: "slate", hex: "#475569" },
  { name: "gray", hex: "#4b5563" },
  { name: "zinc", hex: "#52525b" },
  { name: "neutral", hex: "#525252" },
  { name: "stone", hex: "#57534e" },
];

// Each pattern thumbnail gets its own bg/fg pairing so the strip isn't
// monotone. Pairings echo what an actual shop might pick — warm-on-dark,
// cool-on-light, brand-leaning combos.
const PATTERN_SWATCH_COUNT = 16;
const PATTERN_SWATCHES: Array<{
  key: string;
  label: string;
  bg: string;
  fg: string;
  fn: (color: string, opacity: number) => string;
}> = patterns.slice(0, PATTERN_SWATCH_COUNT).map((p, i) => {
  const palette: Array<[string, string]> = [
    ["#4f46e5", "#fbbf24"], // indigo + amber
    ["#0f766e", "#bef264"], // teal + lime
    ["#b91c1c", "#fde047"], // red + yellow
    ["#7c3aed", "#f9a8d4"], // violet + pink
    ["#059669", "#a7f3d0"], // emerald + mint
    ["#0369a1", "#67e8f9"], // sky + cyan
    ["#be123c", "#fcd34d"], // rose + amber
    ["#1c1917", "#fb923c"], // stone-900 + orange
    ["#831843", "#fbcfe8"], // pink-900 + pink-200
    ["#1e3a8a", "#fde68a"], // blue-900 + amber-200
    ["#854d0e", "#fef3c7"], // yellow-800 + cream
    ["#365314", "#bbf7d0"], // lime-900 + mint
    ["#581c87", "#f3e8ff"], // purple-900 + lavender
    ["#9a3412", "#fed7aa"], // orange-900 + peach
    ["#164e63", "#a5f3fc"], // cyan-900 + ice
    ["#3f3f46", "#fde047"], // zinc-800 + yellow
  ];
  const [bg, fg] = palette[i % palette.length];
  return { key: p.key, label: p.label, fn: p.fn, bg, fg };
});

// Comparison-style features table grouped by category. Kept intentionally
// short — every row should be either a differentiator vs competitors or a
// signal a prospect actually cares about. Internal niceties (date filters,
// activity charts, etc.) live elsewhere on the page, not here.
//
// Column 1 = "every plan" (includes Free) — what you get on day one.
// Column 2 = "paid plan upgrades" — what unlocks as you move up. Detailed
// per-tier limits live on /pricing.
const FEATURE_TABLE: Array<{
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: Array<{
    label: string;
    free: string | true;
    pro: string | true;
    hint?: string;
  }>;
}> = [
  {
    category: "For your customers",
    icon: Smartphone,
    rows: [
      {
        label: "No app to download — opens in any phone browser",
        free: true,
        pro: true,
      },
      {
        label: "Add to Apple Wallet & Google Wallet",
        free: "—",
        pro: "Pro & up",
        hint: "Customers can save their card to Apple or Google Wallet for lock-screen access and automatic updates when they earn a stamp. The browser card still works for everyone.",
      },
      {
        label: "Stamps follow them across devices (optional login)",
        free: true,
        pro: true,
        hint: "Customers can set a password to log in on any device, so they never lose their stamps if they switch or lose their phone.",
      },
      {
        label: "Auto-translates to their language (14 supported)",
        free: true,
        pro: true,
      },
    ],
  },
  {
    category: "Card design",
    icon: Palette,
    rows: [
      { label: "198 colour combinations + 36 patterns", free: true, pro: true },
      { label: "Upload your own logo", free: true, pro: true },
      { label: "Same design on the printable QR PDF", free: true, pro: true },
    ],
  },
  {
    category: "For you",
    icon: Coffee,
    rows: [
      {
        label: "Real-time stamp approval (no separate stamper app)",
        free: true,
        pro: true,
        hint: "When a customer scans, the request pops up live on your dashboard and you approve it there — no separate stamper device or app.",
      },
      { label: "Customer list with notes + tags", free: true, pro: true },
      {
        label: "Built-in lifecycle emails to you and your customers",
        free: true,
        pro: true,
        hint: "Automatic emails with no setup — a welcome, a nudge when your first customer joins, and gentle re-engagement over time.",
      },
      {
        label: "CSV export of your customers",
        free: "—",
        pro: "Plus & Max",
        hint: "Download your customer list — names, emails, stamps, and rewards redeemed — as a spreadsheet.",
      },
    ],
  },
  {
    category: "Team & scale",
    icon: Users,
    rows: [
      {
        label: "Multiple shops under one account",
        free: "1 shop",
        pro: "Up to 10",
      },
      {
        label: "Manager & staff logins",
        free: "—",
        pro: "Plus & Max",
        hint: "Give baristas and managers their own logins to approve stamps, instead of sharing one account.",
      },
      {
        label: "Cross-shop rollup reporting",
        free: "—",
        pro: "Plus & Max",
        hint: "Combine stamps, customers, and redemptions across all your shops into one view.",
      },
      {
        label: "Corporate perk mode (subsidised staff coffee)",
        free: "—",
        pro: "Plus & Max",
        hint: "Designed for companies running their own staff coffee program in partnership with a local cafe — every scan is a free drink (no stamps), limited to staff email domains and capped per person per day.",
      },
    ],
  },
  {
    category: "Pricing",
    icon: Tag,
    rows: [
      { label: "Stamps included", free: "100 lifetime", pro: "Unlimited" },
      { label: "Monthly price", free: "$0", pro: "From $7" },
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
            in 14 languages.
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
                  body: "Card opens in &lt;1 second from a QR scan. No app store, no install, no account.",
                },
                {
                  icon: Languages,
                  title: "14 languages, same card",
                  body: "Flip a setting and the customer card + printable QR PDF auto-translate. Arabic includes proper RTL.",
                },
                {
                  icon: Lock,
                  title: "Built to scale with you",
                  body: "Start free with the full single-shop experience. Upgrade for multi-shop, unlimited staff logins, and CSV exports when your business grows.",
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
                  Coffee, bakery, barber, brewery — make it yours.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-stone-600">
                  Pick from a riot of colours and patterns until the card feels
                  unmistakably <em>you</em>. Built for cafes, just as happy on a
                  bakery, a barber, a brewery, or a juice bar — same QR flow,
                  your style.
                </p>
                <ul className="mt-6 space-y-3 text-base text-stone-700">
                  {[
                    "Live progress bar + animated stamp drop on approval",
                    "Reward countdown personalised by customer name",
                    "Switch-shop list for customers who scan at multiple shops",
                  ].map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-0.5 size-5 shrink-0 text-amber-700" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm italic text-stone-500">
                  → Watch the card flick through 5 example shops over there.
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
                22 hues × 9 shades. 36 patterns. Zero upcharge.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
                The full design system ships on every plan — that&apos;s{" "}
                <strong className="text-stone-900">198 colours</strong> for each
                of foreground and background. Pick a hue, pick a shade, drop in
                a pattern, upload your logo. Live preview while you tweak.
              </p>
            </div>

            {/* Colour swatches — all 22 hues shown so the maths above is honest */}
            <div className="mt-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Pick a hue (22)
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
              </div>
              <p className="mt-2 text-xs text-stone-400">
                Each hue × 9 shades = 198 colours per slot.
              </p>
            </div>

            {/* Pattern swatches — each gets its own colour pair so the strip
                doesn't read as monotone */}
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Pick a pattern (36)
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {PATTERN_SWATCHES.map((p) => (
                  <span
                    key={p.key}
                    title={p.label}
                    className="size-14 rounded-lg ring-1 ring-stone-200"
                    style={{
                      backgroundColor: p.bg,
                      backgroundImage: p.fn(p.fg, 0.35),
                    }}
                  />
                ))}
                <span className="inline-flex size-14 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-500">
                  +{36 - PATTERN_SWATCH_COUNT}
                </span>
              </div>
            </div>

            {/* Brand banner example — real Byron Bay Brewz logo from prod */}
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Upload your shop&apos;s logo
              </p>
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sample-logos/byron-bay-brewz.png"
                  alt="Example shop logo — Byron Bay Brewz"
                  className="block aspect-[3/1] w-full max-w-md rounded-2xl object-cover shadow-sm"
                />
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
                Everything you get on every plan.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
                Branding, languages, analytics, and lifecycle ship on Free —
                even before you upgrade. Paid plans unlock more shops, team
                logins, and customer exports.{" "}
                <a
                  href="/pricing"
                  className="text-amber-700 underline-offset-2 hover:underline"
                >
                  See full plan comparison →
                </a>
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
                  Paid plans
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
                  {rows.map(({ label, free, pro, hint }) => (
                    <div
                      key={label}
                      className="grid grid-cols-[1fr_5rem_5rem] items-center gap-4 border-b border-stone-100 px-6 py-3 last:border-b-0 sm:grid-cols-[1fr_7rem_7rem]"
                    >
                      <span className="flex items-center gap-1.5 text-sm text-stone-700">
                        {label}
                        {hint && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={`About ${label}`}
                                className="cursor-help text-stone-400 transition-colors hover:text-stone-700"
                              >
                                <HelpCircle className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px] text-center">
                              {hint}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>
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
                14 languages, one QR code.
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
                "🇹🇷 Türkçe",
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
          <div className="mx-auto max-w-4xl px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-8 py-16 shadow-xl md:px-16">
              {/* Soft amber glow in the corner for a bit of depth */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-amber-700/10 blur-3xl"
              />
              <div className="relative text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-200 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live in 2 minutes
                </span>
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                  Set up your shop&apos;s loyalty card.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-300 md:text-lg">
                  Free up to 100 stamps. No credit card required. Live in any
                  phone browser, in any of 14 languages.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="cursor-pointer bg-amber-700 px-8 text-base !text-white hover:bg-amber-800"
                    >
                      Set up your shop
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/alternatives">
                    <Button
                      size="lg"
                      variant="outline"
                      className="cursor-pointer border-white/25 bg-white/10 px-8 text-base !text-white backdrop-blur-sm hover:bg-white/20 hover:!text-white"
                    >
                      See how we compare
                    </Button>
                  </Link>
                </div>
                <p className="mt-8 text-xs text-stone-400">
                  No app to download. No feature gating. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
