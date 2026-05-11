import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Coffee,
  QrCode,
  Smartphone,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import Testimonials from "@/components/testimonials";
import { buildHreflangMap } from "@/lib/i18n/landing";

export const metadata: Metadata = {
  title: {
    absolute:
      "Coffee Loyalty Card App for Cafes — Free Digital Stamp Cards | Brewstamp",
  },
  description:
    "The free coffee loyalty card app for cafes. Customers scan a QR code, earn stamps, and redeem free drinks — no customer app to download. Set up in 2 minutes.",
  alternates: { canonical: "/", languages: buildHreflangMap() },
  keywords: [
    "coffee loyalty card",
    "coffee loyalty card app",
    "coffee stamp card",
    "coffee rewards card",
    "digital loyalty card",
    "cafe loyalty program",
    "coffee shop loyalty app",
    "QR code loyalty",
    "digital stamp card",
  ],
  openGraph: {
    type: "website",
    url: "/",
    title: "Coffee Loyalty Card App for Cafes — Free Digital Stamp Cards",
    description:
      "The free coffee loyalty card app for cafes. Customers scan a QR code, earn stamps, and redeem free drinks — no customer app to download.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Loyalty Card App for Cafes — Free Digital Stamp Cards",
    description:
      "The free coffee loyalty card app for cafes. Scan a QR code, earn stamps, redeem free drinks — no customer app to download.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Brewstamp",
      url: "https://brewstamp.app",
      logo: "https://brewstamp.app/apple-touch-icon.png",
      description:
        "Digital coffee loyalty cards and stamp rewards for cafes worldwide. No app download required.",
      areaServed: { "@type": "Place", name: "Worldwide" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Brewstamp",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://brewstamp.app",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Free digital coffee loyalty card for cafes worldwide. Customers scan a QR code to collect stamps and earn rewards.",
      audience: {
        "@type": "BusinessAudience",
        name: "Cafes and coffee shops",
        geographicArea: { "@type": "Place", name: "Worldwide" },
      },
      aggregateRating: undefined,
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a digital coffee loyalty card?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A digital coffee loyalty card replaces paper stamp cards with a phone-based version. Customers scan a QR code at your counter to collect stamps and earn free drinks — no app download required.",
          },
        },
        {
          "@type": "Question",
          name: "How does a QR code coffee rewards program work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You place a QR code at your counter. Customers scan it with their phone camera, you approve the stamp from your dashboard, and the stamp appears on their digital card instantly. After enough stamps, they earn a free drink.",
          },
        },
        {
          "@type": "Question",
          name: "Do customers need to download an app?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Brewstamp works entirely in the phone's browser. Customers just scan the QR code — no app to download, no account to create. It works on any iPhone or Android phone.",
          },
        },
        {
          "@type": "Question",
          name: "How much does a digital loyalty card for cafes cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Brewstamp is free for your first 100 stamps — enough to test if a loyalty program works for your shop. After that, it's $5/month for unlimited stamps.",
          },
        },
        {
          "@type": "Question",
          name: "How long does it take to set up a coffee shop loyalty program?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Less than 2 minutes. Create your shop, customise your card, print your QR code, and start stamping. No technical knowledge required.",
          },
        },
      ],
    },
  ],
};

// Remove undefined values from JSON-LD
const cleanJsonLd = JSON.parse(
  JSON.stringify(jsonLd, (_, v) => (v === undefined ? undefined : v))
);

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanJsonLd) }}
      />
      <PublicHeader transparent />

      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=70&auto=format&fit=crop"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/60 to-stone-900/80" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
              <Coffee className="h-3.5 w-3.5" />
              Free to get started
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              The digital coffee loyalty card
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">your cafe deserves.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
              Replace paper stamp cards with a <mark className="bg-amber-500/20 px-1 text-white">digital rewards program</mark>. Your customers scan a <mark className="bg-amber-500/20 px-1 text-white">QR code</mark>,
              collect stamps, and earn free drinks. <mark className="bg-amber-500/20 px-1 text-white">No app to download</mark>, no
              account to create. The <mark className="bg-amber-500/20 px-1 text-white">coffee loyalty app</mark> that works on <mark className="bg-amber-500/20 px-1 text-white">any phone</mark>.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Set up your shop
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer border-white/20 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  See how it works
                </Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Free up to 100 stamps total
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                No app download
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Works on any phone
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by cafes */}
      <section className="border-b border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Trusted by cafes
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
              Independent cafes running real loyalty programs with us
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Thirty 7even",
                location: "Macquarie Park, Sydney",
                logo: "/customers/thirty-7even.png",
                logoClass: "invert",
              },
              {
                name: "Bennett St Dairy",
                location: "Bondi, Sydney",
                logo: "/customers/bennett-st-dairy.jpg",
              },
              {
                name: "Short Stop Coffee",
                location: "Melbourne & Sydney",
                logo: "/customers/short-stop-coffee.png",
              },
              {
                name: "Tamping Ground",
                location: "Sutherland Shire, Sydney",
                logo: "/customers/tamping-ground.png",
              },
              {
                name: "Baked since 95",
                location: "Hillside, Melbourne",
                logo: "/customers/baked-since-95.jpg",
              },
              {
                name: "Brown Sugar Bakery",
                location: "Forresters Beach, NSW",
                logo: "/customers/brown-sugar-bakery.png",
              },
            ].map(({ name, location, logo, logoClass }) => (
              <div
                key={name}
                className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 px-6 py-8 text-center transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-16 w-full items-center justify-center">
                  <img
                    src={logo}
                    alt={`${name} logo`}
                    className={`max-h-16 w-auto object-contain ${logoClass ?? ""}`}
                    loading="lazy"
                  />
                </div>
                <p className="text-base font-semibold tracking-tight text-stone-900">
                  {name}
                </p>
                <p className="mt-1 text-xs text-stone-500">{location}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-xl text-center text-xs text-stone-400">
            Includes cafes on Brewstamp and on our long-running predecessor
            platform StampyStamp.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Three steps. Zero friction.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-stone-500">
              Your customers don&apos;t need to download anything or create an
              account. It just works.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: QrCode,
                step: "1",
                title: "Customer scans your QR",
                desc: "Print your unique QR code and place it at the counter. Customers point their phone camera at it — that's it.",
              },
              {
                icon: Zap,
                step: "2",
                title: "You approve the stamp",
                desc: "A request pops up on your dashboard instantly. Tap approve and the stamp lands on their card in real-time.",
              },
              {
                icon: Coffee,
                step: "3",
                title: "They earn a free drink",
                desc: "After collecting enough stamps, they automatically earn a reward. You choose the threshold — 6, 8, 10, it's up to you.",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative rounded-2xl border border-stone-200 bg-stone-50 p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                  <Icon className="h-6 w-6 text-amber-700" />
                </div>
                <span className="absolute right-6 top-6 text-5xl font-bold text-stone-200">
                  {step}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-stone-900">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-stone-200 bg-stone-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Why Brewstamp
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Built for busy cafes
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: "No app required",
                desc: "Customers open a link in their browser. Works on iPhone, Android, any device with a camera.",
              },
              {
                icon: Clock,
                title: "Real-time approvals",
                desc: "Live connection between your dashboard and the customer's phone. Approve stamps instantly.",
              },
              {
                icon: Shield,
                title: "Fraud-proof",
                desc: "Every stamp requires merchant approval. No more customers stamping their own cards in the glovebox.",
              },
              {
                icon: TrendingUp,
                title: "Customer insights",
                desc: "See who visits, how often they come, and how close they are to their next reward.",
              },
              {
                icon: QrCode,
                title: "One QR code",
                desc: "Generate, download, and print your QR code from the dashboard. Stick it at the register, on the menu, anywhere.",
              },
              {
                icon: Coffee,
                title: "Fully customisable",
                desc: "Set your own stamp threshold. 6 coffees for a free one? 10? Your shop, your rules.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Icon className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="mb-1.5 font-semibold text-stone-900">{title}</h3>
                <p className="text-sm leading-relaxed text-stone-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            Loyalty should be simple
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-stone-500">
            Paper cards get lost, apps get deleted, but a QR code at the counter
            is always there. Brewstamp keeps your regulars coming back with
            zero effort on their part.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8">
            {[
              { value: "< 5s", label: "Customer setup time" },
              { value: "0", label: "Apps to download" },
              { value: "$5", label: "Per month after 100 total stamps" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-amber-700 md:text-4xl">
                  {value}
                </p>
                <p className="mt-1 text-sm text-stone-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="relative overflow-hidden border-y border-stone-200 bg-stone-50 py-20">
        <img
          src="/world-map.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15 grayscale"
          loading="lazy"
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
            Available worldwide
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            Your customer card in 12 languages
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-500">
            Pick the language that matches your customers — the loyalty card and
            printable QR code translate automatically.
          </p>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2 text-sm">
            {[
              ["/", "🇺🇸", "English", "Hello"],
              ["/ar", "🇸🇦", "العربية", "مرحبا"],
              ["/fr", "🇫🇷", "Français", "Bonjour"],
              ["/de", "🇩🇪", "Deutsch", "Hallo"],
              ["/hi", "🇮🇳", "हिन्दी", "नमस्ते"],
              ["/id", "🇮🇩", "Bahasa Indonesia", "Halo"],
              ["/it", "🇮🇹", "Italiano", "Ciao"],
              ["/ja", "🇯🇵", "日本語", "こんにちは"],
              ["/ko", "🇰🇷", "한국어", "안녕하세요"],
              ["/zh", "🇨🇳", "中文", "你好"],
              ["/pt", "🇵🇹", "Português", "Olá"],
              ["/es", "🇪🇸", "Español", "Hola"],
            ].map(([href, flag, name, hello]) => (
              <Link
                key={name}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-stone-700 transition-colors hover:border-amber-300 hover:bg-amber-50"
              >
                <span aria-hidden>{flag}</span>
                <span className="text-stone-400">{hello}</span>
                <span className="font-medium">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Pricing */}
      <section className="border-t border-stone-200 bg-stone-50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mx-auto mt-4 max-w-md text-stone-500">
              Start free — your first 100 stamps are on us. Only pay when
              your loyalty program is taking off.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-stone-900">Free</h3>
              <p className="mt-1 text-sm text-stone-500">
                Perfect to try it out
              </p>
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
                  QR code generation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Real-time stamp approvals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Customer dashboard
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
              <p className="mt-1 text-sm text-stone-500">
                For busy shops
              </p>
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
                  Everything in Free
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
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "What is a digital coffee loyalty card?",
                a: "A digital coffee loyalty card replaces paper stamp cards with a phone-based version. Customers scan a QR code at your counter to collect stamps and earn free drinks — no app download required.",
              },
              {
                q: "How does a QR code coffee rewards program work?",
                a: "You place a QR code at your counter. Customers scan it with their phone camera, you approve the stamp from your dashboard, and the stamp appears on their digital card instantly. After enough stamps, they earn a free drink.",
              },
              {
                q: "Do customers need to download an app?",
                a: "No. Brewstamp works entirely in the phone's browser. Customers just scan the QR code — no app to download, no account to create. It works on any iPhone or Android phone.",
              },
              {
                q: "How much does a digital loyalty card for cafes cost?",
                a: "Brewstamp is free for your first 100 stamps — enough to test if a loyalty program works for your shop. After that, it's $5/month for unlimited stamps.",
              },
              {
                q: "How long does it take to set up a coffee shop loyalty program?",
                a: "Less than 2 minutes. Create your shop, customise your card, print your QR code, and start stamping. No technical knowledge required.",
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
        <Image
          src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1600&q=70&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          loading="lazy"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/75" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ready to reward your regulars?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-300">
            Set up takes less than two minutes. Create your shop, print your QR
            code, and start stamping today.
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
