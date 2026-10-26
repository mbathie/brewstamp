import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Coffee,
  Gift,
  Smartphone,
  Wallet,
  Languages,
  RefreshCw,
  Store,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { FREE_STAMPS } from "@/lib/plans";
import { getPlanCatalog } from "@/lib/plan-catalog";
import { PLAN_OFFERS, withPlanOffers } from "@/lib/structured-data";

// Plans and prices (in the JSON-LD offers) come from the database.
export const revalidate = 300;

// Owns the CUSTOMER-REWARDS angle: what the rewards card looks like to the
// customer, wallet passes, and reward design ("coffee rewards app/card").
// The operator angle (counter flow, staff, multi-shop, dashboard, CSV) lives
// on /cafe-loyalty-app, and the homepage owns "loyalty card / stamp card" —
// keep the three distinct so they don't cannibalise each other.
export const metadata: Metadata = {
  title: {
    absolute: "Coffee Rewards App & Rewards Card for Cafe Customers | Brewstamp",
  },
  description:
    `The coffee rewards card your customers get: scan a QR code, no app, stamps toward a free coffee, saved to Apple or Google Wallet. Free for your first ${FREE_STAMPS} stamps.`,
  alternates: { canonical: "/coffee-rewards-app" },
  keywords: [
    "coffee rewards app",
    "coffee rewards card",
    "coffee reward card",
    "coffee rewards program",
    "digital coffee rewards card",
    "coffee rewards apple wallet",
    "coffee rewards google wallet",
    "free coffee rewards",
  ],
  openGraph: {
    type: "website",
    url: "/coffee-rewards-app",
    title: "Coffee Rewards App & Rewards Card for Cafe Customers",
    description:
      "What your customers get: a branded coffee rewards card that opens from a QR scan, saves to Apple or Google Wallet, and fills toward a free coffee.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Rewards App & Rewards Card for Cafe Customers",
    description:
      "A branded coffee rewards card that opens from a QR scan, saves to Apple or Google Wallet, and fills toward a free coffee.",
  },
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "What does a coffee rewards card look like to my customers?",
    a: "A card in your colours, with your logo and an optional background pattern, showing a row of stamps that fills toward their free coffee. Once they add their name it counts down personally (\"two more until your free coffee\"), and each approved stamp drops onto the card with a short animation. It opens in their phone's browser from your QR code — there's no app to install.",
  },
  {
    q: "Can customers add the rewards card to Apple Wallet or Google Wallet?",
    a: "Yes. When you switch on wallet passes in Shop Setup, customers see an Add to Apple Wallet or Add to Google Wallet button matching their phone. The pass uses your logo and colours, shows their stamp count and the reward, and updates automatically every time you approve a stamp. It's included on every plan, including Free.",
  },
  {
    q: "How many stamps should my coffee rewards card need for a free coffee?",
    a: "Most cafes land between 6 and 10, and 8 is the default. You can set anything from 1 to 20 per shop and change it later. Lower thresholds feel generous and get more customers to a first reward; higher ones suit cheaper drinks or very frequent regulars.",
  },
  {
    q: "What happens to extra stamps after a customer claims a free coffee?",
    a: "They carry over. If a customer has 9 stamps on an 8-stamp card and redeems their free coffee, the card drops back to 1 rather than zero — nobody loses a stamp they earned. They can also collect a stamp for today's paid coffee in the same visit.",
  },
  {
    q: "Do customers need an account or app for the coffee rewards app to work?",
    a: "No. A first-time customer scans, taps to request a stamp, and is done. Adding a name and email is optional; setting a password lets their stamps follow them to a new phone. If they visit more than one Brewstamp shop, they can switch between those cards from the same screen.",
  },
  {
    q: "Can the rewards card be in my customers' language?",
    a: "Yes. Brewstamp's customer card is available in 14 languages, including right-to-left Arabic. You choose the language per shop, and it applies to the card, the wallet passes, and the printed QR code.",
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
        "A coffee rewards app that gives cafe customers a branded digital rewards card: scan a QR code, collect stamps toward a free coffee, and save the card to Apple Wallet or Google Wallet — no app download required.",
      offers: PLAN_OFFERS,
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

// A customer's first visit, told from their side of the counter.
const STEPS: Array<{ icon: typeof QrCode; title: string; body: string }> = [
  {
    icon: QrCode,
    title: "Point the camera at your QR",
    body: "Their rewards card opens in the phone's browser, already in your colours. No app store, no signup form.",
  },
  {
    icon: Coffee,
    title: "Tap for a stamp",
    body: "You approve it at the till and the stamp drops onto the card with a little animation — the moment that makes it feel real.",
  },
  {
    icon: Wallet,
    title: "Keep it in their wallet",
    body: "One tap adds the card to Apple Wallet or Google Wallet, so it's there on the lock screen next time.",
  },
  {
    icon: Gift,
    title: "Claim the free coffee",
    body: "When the card fills, they ask for their reward from the same screen and you approve it. Extra stamps carry over.",
  },
];

const CUSTOMER_PERKS: Array<{ icon: typeof Smartphone; title: string; body: string }> = [
  {
    icon: Smartphone,
    title: "Nothing to download",
    body: "The card is a web page behind your QR code. Customers who would never install a cafe app still collect stamps from their very first visit.",
  },
  {
    icon: RefreshCw,
    title: "Stamps that follow them",
    body: "An optional password lets customers log in on a new phone and find their stamps waiting. A lost phone doesn't mean a lost free coffee.",
  },
  {
    icon: Languages,
    title: "In their language",
    body: "The card reads in any of 14 languages — English, Spanish, Japanese, Arabic (right-to-left) and more — set per shop.",
  },
  {
    icon: Store,
    title: "One card per cafe, all in one place",
    body: "Customers who collect at more than one Brewstamp shop can switch between their cards without hunting for old links.",
  },
];

const CARD_DETAILS = [
  "Your logo, background and stamp colours, and an optional pattern",
  "A stamp grid and progress bar that fill toward the free coffee",
  "A countdown that uses the customer's name once they've added it",
  "An animated stamp drop the moment you approve at the till",
  "A redeem button that appears as soon as the reward is unlocked",
];

export default async function CoffeeRewardsAppPage() {
  const catalog = await getPlanCatalog();
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(withPlanOffers(jsonLd, catalog)) }}
      />
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-4xl px-6 pt-28 pb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
            Coffee rewards app
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
            The coffee rewards app your regulars will actually keep
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-500">
            Give every customer a coffee rewards card in your cafe&apos;s
            colours: it opens from a QR scan, fills with stamps toward a free
            coffee, and saves to Apple Wallet or Google Wallet. No app for them
            to download, no account to create. Free for your first{" "}
            {FREE_STAMPS}{" "}stamps.
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

        {/* What customers get */}
        <section className="mx-auto w-full max-w-3xl px-6 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            What your customers get: a coffee rewards card on their phone
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            A rewards program only works if customers can see it working. A
            paper punch card does that well — you can feel it filling up —
            but it lives in a wallet, goes through the wash, and is forgotten
            on the day it would have earned a free coffee. A digital coffee
            rewards card keeps what customers like about the paper version
            (the visible stamps, the simple &ldquo;buy some, get one free&rdquo;
            deal) and drops the part that fails.
          </p>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            With Brewstamp, that card is the first thing a customer sees after
            scanning your QR code. It looks like your cafe, not like a
            third-party rewards brand:
          </p>
          <ul className="mt-4 space-y-2">
            {CARD_DETAILS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-base leading-relaxed text-stone-600"
              >
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-amber-700" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Every stamp is approved by you at the counter, so the card a
            customer shows you is the card they actually earned. Customers
            can&apos;t add stamps themselves, and nobody can top up a card from
            a screenshot.
          </p>
        </section>

        {/* Customer journey */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
              A customer&apos;s first visit, from their side of the counter
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-stone-500">
              The whole thing takes about as long as tapping a card to pay.
              That matters: a rewards card that slows down the queue gets
              skipped.
            </p>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Wallet passes */}
        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Apple Wallet and Google Wallet rewards passes
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            The browser card is great at the counter. Between visits, though,
            a browser tab is easy to lose. That&apos;s why customers can save
            their coffee rewards card to Apple Wallet or Google Wallet, where
            it sits next to their boarding passes and payment cards, one swipe
            from the lock screen.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h3 className="text-base font-semibold text-stone-900">
                Branded like the card
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                The pass uses the logo and colours you set for your card, and
                shows the customer&apos;s name, their stamp count and the
                reward they&apos;re working toward. On iPhone, a row of stamps
                fills across the pass as they earn.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h3 className="text-base font-semibold text-stone-900">
                Updates on its own
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                When you approve a stamp, the wallet pass updates
                automatically, so the count is always right without the
                customer opening anything. The back of the pass links to their
                card online in case they ever lose it.
              </p>
            </div>
          </div>
          <p className="mt-6 text-base leading-relaxed text-stone-600">
            Wallet passes are included on every plan, including Free. You
            switch them on once in Shop Setup and every customer then sees the
            right Add to Wallet button for their phone. The browser card keeps
            working for everyone else, so nobody is left out. The full
            walkthrough is in{" "}
            <Link
              href="/blog/apple-google-wallet-loyalty-card"
              className="text-amber-700 underline-offset-2 hover:underline"
            >
              how to add your coffee loyalty card to Apple Wallet and Google
              Wallet
            </Link>
            .
          </p>
        </section>

        {/* Reward design */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-3xl px-6">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Designing the reward: how many stamps for a free coffee?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The reward is the part of a coffee rewards program customers
              actually talk about, so it&apos;s worth a minute of thought.
              Brewstamp keeps it deliberately simple: one card per shop, one
              reward, a free drink once the card is full. You choose how many
              stamps that takes, anywhere from 1 to 20, and you can change it
              later.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-2xl font-bold text-amber-700">6</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  Generous
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  New customers reach a first free coffee fast, which is
                  usually what turns a one-off visit into a habit.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-2xl font-bold text-amber-700">8</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  The usual
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Brewstamp&apos;s default, and the number most regulars
                  already expect from a paper punch card.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-2xl font-bold text-amber-700">10</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  Long game
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Suits daily regulars and lower-margin drinks. Much higher and
                  casual customers stop believing they&apos;ll get there.
                </p>
              </div>
            </div>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              A few details make the reward feel fair. Stamps past the
              threshold carry over after a free coffee, so a customer is never
              punished for a busy week. A customer can claim a reward and
              collect a stamp for today&apos;s paid coffee in the same visit.
              And when someone buys a round for the office, you can award
              several stamps in a single approval instead of making them scan
              five times. For a deeper look at thresholds and what they cost
              you, read{" "}
              <Link
                href="/blog/how-many-stamps-for-a-free-coffee"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                how many stamps for a free coffee
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Why customers stick with it */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
            Why customers keep using a digital coffee reward card
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {CUSTOMER_PERKS.map((f) => (
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
          <p className="mx-auto mt-8 max-w-3xl text-center text-base leading-relaxed text-stone-600">
            This page is about what your customers see. If you want to know
            how it runs on your side — approving stamps at the till, staff
            logins, multiple shops and your customer list — see{" "}
            <Link
              href="/cafe-loyalty-app"
              className="text-amber-700 underline-offset-2 hover:underline"
            >
              how the cafe loyalty app works behind the counter
            </Link>
            .
          </p>
        </section>

        {/* Pricing teaser */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-3xl px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The full rewards card on every plan
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-stone-600">
              Everything on this page — your branded card, wallet passes, 14
              languages — is included on Free, for your first {FREE_STAMPS}{" "}
              stamps. When your regulars are hooked, Pro gives one shop
              unlimited stamps for $12/month.
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
            Coffee rewards card FAQ
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
                href="/cafe-loyalty-app"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Cafe loyalty app: running stamps, staff and shops at the counter →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/apple-google-wallet-loyalty-card"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Add your coffee loyalty card to Apple Wallet &amp; Google Wallet →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/digital-loyalty-cards-for-cafes"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Digital Loyalty Cards for Cafes: The Complete Guide →
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
              Give your customers a coffee rewards card today
            </h2>
            <p className="mt-2 text-stone-500">
              Pick your colours, set your free-coffee threshold, print one QR
              code. Free for your first {FREE_STAMPS}{" "}stamps.
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
