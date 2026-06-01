import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Coffee,
  Gift,
  Smartphone,
  Zap,
  Star,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: {
    absolute: "Coffee Rewards App for Cafes — No App to Download | Brewstamp",
  },
  description:
    "Brewstamp is a coffee rewards app and digital rewards card for cafes. Customers scan a QR code — no app, no signup — and earn stamps toward a free coffee. Free for your first 100 stamps.",
  alternates: { canonical: "/coffee-rewards-app" },
  keywords: [
    "coffee rewards app",
    "coffee rewards card",
    "coffee reward card",
    "coffee rewards program",
    "coffee rewards",
    "cafe rewards app",
    "digital coffee rewards card",
    "coffee loyalty card",
  ],
  openGraph: {
    type: "website",
    url: "/coffee-rewards-app",
    title: "Coffee Rewards App for Cafes — No App to Download",
    description:
      "A coffee rewards app and digital rewards card for your cafe. Customers scan a QR code — no app, no signup — and earn stamps toward a free coffee.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Rewards App for Cafes — No App to Download",
    description:
      "A coffee rewards app and digital rewards card for your cafe. Scan a QR code — no app, no signup — and earn stamps toward a free coffee.",
  },
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Is there a free coffee rewards app?",
    a: "Yes. Brewstamp is free to use for your first 100 stamps — no card details, no trial clock. That is enough to run a real rewards card at a quiet cafe for weeks. When your program takes off, paid plans start at $7/month for unlimited stamps.",
  },
  {
    q: "Do my customers need to download an app?",
    a: "No. That is the whole point. Your customer scans a QR code at the counter, their digital rewards card opens in their phone's browser, and they collect a stamp. Nothing to install, no account to create, no app store. You approve each stamp from your own phone so it can't be gamed.",
  },
  {
    q: "What's the difference between a coffee rewards card and a stamp card?",
    a: "They're the same idea — buy a set number of coffees, get one free — just digital. A paper stamp card lives in a wallet and gets lost; a digital coffee rewards card lives on the customer's phone and can't be forged with a borrowed stamp. The reward (e.g. a free coffee after 8) is identical.",
  },
  {
    q: "How many stamps should a coffee rewards program need for a free coffee?",
    a: "Most cafes land between 6 and 10. Eight is the most common — frequent enough that regulars finish a card, generous enough to feel worth chasing. You set the threshold per shop and can change it any time.",
  },
  {
    q: "Can I brand the rewards card to match my cafe?",
    a: "Yes. Each shop has its own logo, colours, background pattern, stamp goal, and customer-facing language. The rewards card your customers see looks like your cafe, not like a generic app.",
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
        "A coffee rewards app and digital rewards card for cafes. Customers scan a QR code to earn stamps toward a free coffee — no app download required.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free for your first 100 stamps; paid plans from $7/month.",
      },
      url: "https://brewstamp.app/coffee-rewards-app",
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
    title: "Customer scans your QR code",
    body: "A small card or sticker by the till. Their rewards card opens in the browser — no app, no signup.",
  },
  {
    icon: Coffee,
    title: "You approve the stamp",
    body: "A request pops up on your phone. One tap and the stamp lands — so a customer can't add their own.",
  },
  {
    icon: Gift,
    title: "They earn a free coffee",
    body: "When the card fills, the reward unlocks automatically. They show you the screen, you pour the free one.",
  },
];

const FEATURES: Array<{ icon: typeof Zap; title: string; body: string }> = [
  {
    icon: Smartphone,
    title: "No customer app",
    body: "The single biggest reason punch-card replacements fail is the download step. Brewstamp has none — it's a web rewards card.",
  },
  {
    icon: Zap,
    title: "Real-time approval",
    body: "Stamps are approved by you, in the moment, from your phone. No separate stamper device, no fraud from screenshots.",
  },
  {
    icon: Star,
    title: "Branded to your cafe",
    body: "Your logo, colours, pattern, and reward threshold. Customers see your cafe — not a third-party rewards brand.",
  },
  {
    icon: Coffee,
    title: "Built for coffee",
    body: "Stamps toward a free coffee, the way regulars already think about it. Nothing to re-explain at the counter.",
  },
];

export default function CoffeeRewardsAppPage() {
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
            Coffee rewards app
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
            A coffee rewards app with no app to download
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-500">
            Brewstamp turns the QR code on your counter into a digital coffee
            rewards card. Customers scan, collect stamps, and earn a free
            coffee — no app store, no signup, no plastic punch card. Free for
            your first 100 stamps.
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

        {/* What is a coffee rewards card */}
        <section className="mx-auto w-full max-w-3xl px-6 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            What is a digital coffee rewards card?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            A coffee rewards card is the same deal regulars already know — buy
            a set number of coffees, get one free — without the paper. Instead
            of a punch card that lives in a wallet and gets lost, the rewards
            card lives on your customer&apos;s phone. They scan your QR code,
            you approve the stamp, and the card fills toward their free coffee.
          </p>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Because the stamp is approved by you rather than self-served, a
            coffee rewards app like Brewstamp can&apos;t be gamed with a
            borrowed stamp or a screenshot — and you get a customer list out of
            it, which a paper card never gave you.
          </p>
        </section>

        {/* How it works */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
              How the rewards card works
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
            Why cafes pick Brewstamp for rewards
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
              Run your coffee rewards program free for your first 100 stamps.
              Pro unlocks unlimited stamps and customer analytics for a single
              shop; Plus and Max add team logins and multiple locations.
            </p>
            <Link href="/pricing" className="mt-6 inline-block">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
              >
                Compare plans
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Coffee rewards app FAQ
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

        {/* Related guides — internal links */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-8">
          <h2 className="text-lg font-semibold text-stone-900">
            Read more on coffee loyalty &amp; rewards
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/blog/digital-loyalty-cards-for-cafes"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Coffee Loyalty Card: The Complete Guide for Cafes →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/coffee-shop-loyalty-cards"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Coffee shop loyalty cards: paper vs digital →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/how-many-stamps-for-a-free-coffee"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                How many stamps for a free coffee? →
              </Link>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-20">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-stone-900">
              Launch your coffee rewards card today
            </h2>
            <p className="mt-2 text-stone-500">
              Set it up in five minutes, print one QR code, and start stamping.
              Free for your first 100 stamps.
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
