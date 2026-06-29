import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  QrCode,
  Coffee,
  Gift,
  Wallet,
  BarChart3,
  Store,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: {
    absolute: "Cafe Loyalty App — No Download for Customers | Brewstamp",
  },
  description:
    "Brewstamp is a cafe loyalty app your customers never install. They scan a QR code, collect stamps in the browser, and earn a free coffee. Free for your first 100 customers.",
  alternates: { canonical: "/cafe-loyalty-app" },
  // Owns the "loyalty app" framing (cafe/coffee loyalty app, coffee shop
  // loyalty app). Distinct from /coffee-rewards-app ("rewards") and the
  // homepage ("loyalty card / stamp card") so the three pages don't compete.
  keywords: [
    "cafe loyalty app",
    "coffee loyalty app",
    "coffee shop loyalty app",
    "loyalty app for coffee shops",
    "cafe loyalty card",
    "coffee shop loyalty reward app",
    "loyalty app for cafes",
  ],
  openGraph: {
    type: "website",
    url: "/cafe-loyalty-app",
    title: "Cafe Loyalty App — No Download for Customers",
    description:
      "A cafe loyalty app your customers never install. They scan a QR code, collect stamps in the browser, and earn a free coffee.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cafe Loyalty App — No Download for Customers",
    description:
      "A cafe loyalty app your customers never install. Scan a QR code, collect stamps, earn a free coffee.",
  },
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Is Brewstamp a cafe loyalty app?",
    a: "Yes — but it's the kind your customers never have to install. You get the dashboard, stamping, and customer insights of a loyalty app; your customers get a card that opens in their phone's browser when they scan your QR code. All of the app, none of the download.",
  },
  {
    q: "Why is 'no download' such a big deal for a coffee loyalty app?",
    a: "Because the download is where loyalty apps lose people. A regular won't install an app to save 20 seconds at the till. By skipping the app store entirely, far more of your customers actually start — and finish — a card, which is the whole point.",
  },
  {
    q: "Do I need a separate device or POS integration?",
    a: "No. Brewstamp runs on the phone or tablet you already have. You approve each stamp yourself, so there's no scanner to buy and nothing to wire into your POS. It works alongside whatever till you already use.",
  },
  {
    q: "Can the loyalty card live in Apple Wallet or Google Wallet?",
    a: "Yes. The browser card is the default, but customers can also save it to Apple Wallet or Google Wallet for lock-screen access — and it updates automatically each time they earn a stamp. Still nothing to download from an app store.",
  },
  {
    q: "How much does the cafe loyalty app cost?",
    a: "Free for your first 100 customers — enough to prove a loyalty program works for your shop before you pay anything. After that, unlimited plans start at $7/month, with multi-shop and team options above that.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Brewstamp",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "A cafe loyalty app that customers reach by scanning a QR code — no download required. Collect stamps toward a free coffee.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free for your first 100 customers; paid plans from $7/month.",
      },
      url: "https://brewstamp.app/cafe-loyalty-app",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

const STEPS: Array<{ icon: typeof QrCode; title: string; body: string }> = [
  {
    icon: QrCode,
    title: "They scan, no install",
    body: "A QR code by the till opens the loyalty card in the browser. No app store, no account — they're in within seconds.",
  },
  {
    icon: Coffee,
    title: "You approve each stamp",
    body: "A request lands on your phone; one tap adds the stamp. Nothing self-served, so the card can't be padded by screenshots.",
  },
  {
    icon: Gift,
    title: "They earn a free coffee",
    body: "When the card fills, the reward unlocks on their screen. You see their progress in the dashboard like any loyalty app.",
  },
];

const FEATURES: Array<{ icon: typeof Smartphone; title: string; body: string }> = [
  {
    icon: Smartphone,
    title: "No app for customers",
    body: "The card runs in the browser from a QR scan — the install step that kills loyalty-app adoption simply isn't there.",
  },
  {
    icon: Wallet,
    title: "Apple & Google Wallet",
    body: "Customers can save the card to their wallet for lock-screen access and live stamp updates. Optional, on every plan.",
  },
  {
    icon: BarChart3,
    title: "Real customer insights",
    body: "You get the dashboard a loyalty app should have — who's coming back, how close they are to a reward, and an exportable list.",
  },
  {
    icon: Store,
    title: "Branded to your cafe",
    body: "Your logo, colours, pattern, and stamp goal. Customers see your shop, not a third-party loyalty brand.",
  },
];

export default function CafeLoyaltyAppPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-4xl px-6 pt-28 pb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
            Cafe loyalty app
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
            The cafe loyalty app your customers never install
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-500">
            Brewstamp gives you everything a coffee loyalty app should — stamping,
            rewards, branding, and customer insights — without making your
            customers download anything. They scan your QR code and the card
            opens in their browser. Free for your first 100 customers.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
              >
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="cursor-pointer border-stone-300 !bg-white px-8 text-base !text-stone-900 hover:!bg-stone-100"
              >
                See pricing
              </Button>
            </Link>
          </div>
        </section>

        {/* The download problem */}
        <section className="mx-auto w-full max-w-3xl px-6 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            A loyalty app without the app-store problem
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Traditional coffee shop loyalty apps ask the customer to find,
            download, and sign into an app before they can collect a single
            stamp. Most won&apos;t — and the ones who do often delete it a week
            later. The download is the leak that drains every punch-card
            replacement.
          </p>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Brewstamp removes that step. The loyalty app lives on{" "}
            <em>your</em> side — the dashboard, the stamping, the customer list.
            Your customers just scan a QR code and a branded card opens in their
            phone&apos;s browser. They can add it to{" "}
            <Link
              href="/features"
              className="text-amber-700 underline-offset-2 hover:underline"
            >
              Apple Wallet or Google Wallet
            </Link>{" "}
            if they want, but they never visit an app store.
          </p>
        </section>

        {/* How it works */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
              How the loyalty app works for your cafe
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <s.icon className="size-6 text-amber-700" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-stone-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Brewstamp */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
            What you get from the loyalty app
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200 bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <f.icon className="size-5 text-amber-700" />
                  </div>
                  <h3 className="text-base font-semibold text-stone-900">
                    {f.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-3xl px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Free to start, $7/month when you grow
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-stone-600">
              Run your cafe loyalty program free for your first 100 customers.
              Pro unlocks unlimited stamps and customer analytics for a single
              shop; Plus and Max add team logins and multiple locations.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/pricing">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Compare plans
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Cafe loyalty app FAQ
          </h2>
          <div className="mt-6 space-y-4">
            {FAQ.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-stone-200 bg-white px-6 py-5"
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
        </section>

        {/* Related — internal links */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-8">
          <h2 className="text-lg font-semibold text-stone-900">
            Related reading
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/coffee-rewards-app"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Coffee rewards app for cafes →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/coffee-shop-loyalty-cards"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Coffee shop loyalty cards: rewards &amp; setup guide →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/digital-loyalty-cards-for-cafes"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Coffee loyalty card: the complete guide →
              </Link>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-20">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-stone-900">
              Launch your cafe loyalty program today
            </h2>
            <p className="mt-2 text-stone-500">
              Set it up in five minutes, print one QR code, and start stamping.
              Free for your first 100 customers — no app for anyone to download.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Get started free
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
