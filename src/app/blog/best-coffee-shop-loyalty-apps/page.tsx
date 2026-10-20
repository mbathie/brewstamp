import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { FREE_STAMPS } from "@/lib/plans";

// Comparison roundup targeting the "cafe loyalty app" / "coffee loyalty app" /
// "coffee rewards app" query cluster (see the 2026-10 SEO report) — searchers
// on those queries want to compare options, not land on a single product page.
//
// Competitor facts are deliberately limited to what the /alternatives/* pages
// already state (last reviewed May 2026). If a competitor's pricing changes,
// update the matching alternatives page and this post together.

const TITLE = "Best Coffee Shop Loyalty Apps (2026): 7 Compared";
const OG_DESCRIPTION =
  "Brewstamp, Square Loyalty, Stamp Me, Loopy Loyalty, Loyverse, PunchPass and Smile.io compared — app downloads, POS lock-in, pricing, and who each one suits.";
const HERO =
  "https://images.pexels.com/photos/30294330/pexels-photo-30294330.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";
const OG_IMAGE =
  "https://images.pexels.com/photos/30294330/pexels-photo-30294330.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Choosing a coffee shop loyalty app? We compare Brewstamp, Square Loyalty, Stamp Me, Loopy Loyalty, Loyverse, PunchPass and Smile.io on price and app downloads.",
  alternates: {
    canonical: "/blog/best-coffee-shop-loyalty-apps",
  },
  openGraph: {
    type: "article",
    url: "/blog/best-coffee-shop-loyalty-apps",
    title: TITLE,
    description: OG_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Modern cafe interior with a coffee counter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: OG_DESCRIPTION,
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/best-coffee-shop-loyalty-apps",
  datePublished: "2026-10-21",
  dateModified: "2026-10-21",
  image: HERO,
};

// One entry per app — drives both the comparison table and the per-app
// sections, so the two can't disagree.
type App = {
  name: string;
  slug: string | null; // /alternatives/<slug>, null for Brewstamp itself
  bestFor: string;
  customerApp: string;
  lockIn: string;
  free: string;
  paid: string;
  rewards: string;
  summary: string[];
  pros: string[];
  cons: string[];
};

const APPS: App[] = [
  {
    name: "Brewstamp",
    slug: null,
    bestFor: "Independent cafes that want a stamp card with no customer app",
    customerApp: "No — opens in the browser",
    lockIn: "None — works alongside any POS",
    free: `Yes — first ${FREE_STAMPS} stamps`,
    paid: "$7/mo flat",
    rewards: "Stamp per visit, free-drink threshold",
    summary: [
      "Yes, this is our product, so read this section with that in mind. Brewstamp is a browser-based coffee loyalty app: the customer scans a QR code at the counter, their stamp card opens in the phone browser, and the stamp lands once you approve it from your dashboard. No App Store, no sign-up form, no POS integration to set up.",
      `It's free for your first ${FREE_STAMPS} stamps, then $7/mo flat for unlimited stamps on one shop. Plus ($19/mo) covers up to 3 shops with staff logins and CSV exports; Max ($29/mo) covers up to 10. Cards can also be saved to Apple Wallet and Google Wallet on every plan, including Free, and the customer-facing card is translated into 14 languages.`,
    ],
    pros: [
      "No app for customers to install — the biggest single driver of sign-ups",
      "Every stamp needs merchant approval, so self-stamping isn't possible",
      "Public, flat pricing; set up in about 2 minutes",
      "Works with whatever POS or card terminal you already have",
    ],
    cons: [
      "One mechanic only: stamps per visit toward a reward — no points-per-dollar or VIP tiers",
      "No push notifications or SMS marketing built in",
      "Not wired into your POS, so stamping is a separate scan-and-approve step",
      `The free tier is ${FREE_STAMPS} stamps in total, not per month — it's a trial, not a forever plan`,
    ],
  },
  {
    name: "Square Loyalty",
    slug: "square-loyalty",
    bestFor: "Cafes already running everything on Square POS",
    customerApp: "Can involve Square's customer app or a stored card",
    lockIn: "Square POS required",
    free: "No — paid add-on",
    paid: "Around $45/mo + Square fees",
    rewards: "Points by spend, multiple reward tiers",
    summary: [
      "Square Loyalty is the loyalty add-on inside Square POS. Because it sits on the same system as your payments, points are earned automatically from the sale and the reporting is tied to real transaction data — that's its genuine strength.",
      "The catch is that it only makes sense if you run Square. It's a paid add-on (around $45/month when we last reviewed it, on top of Square processing fees), and it earns points by dollars spent rather than stamps by visit.",
    ],
    pros: [
      "Loyalty, payments and reporting in one bill",
      "Points-by-spend suits cafes with a wide menu and varied ticket sizes",
      "Multi-tier rewards and richer campaign tooling",
    ],
    cons: [
      "Requires Square POS — switch POS and the program goes with it",
      "No free tier; noticeably higher monthly cost",
      "More set-up than a standalone QR card",
    ],
  },
  {
    name: "Stamp Me",
    slug: "stamp-me",
    bestFor: "Multi-location operators who want push, SMS and hardware",
    customerApp: "Yes — Stamp Me app",
    lockIn: "None",
    free: "30-day free trial",
    paid: "From $29/mo (Lite); $49–79/mo higher plans",
    rewards: "Digital stamp cards, gamification on top plans",
    summary: [
      "Stamp Me is one of the longer-running digital stamp card platforms. It's feature-rich: push notifications and SMS on its higher plans, a tap-to-stamp counter device called StampPod, and gamification like Scratch & Win on its top tier.",
      "The trade-offs are the customer app — customers download the Stamp Me app to collect stamps — and pricing that starts at $29/month on the Lite plan, rising to $49–79/month (as of our May 2026 review).",
    ],
    pros: [
      "Mature product with push notifications and SMS marketing",
      "Optional StampPod hardware for very fast queues",
      "Gamification and VIP support on the top plan",
    ],
    cons: [
      "Customers must install an app, which lowers enrolment",
      "Highest entry price of the stamp-card tools here",
      "Trial rather than an ongoing free option",
    ],
  },
  {
    name: "Loopy Loyalty",
    slug: "loopy-loyalty",
    bestFor: "Cafes that want a highly customised Wallet-pass card",
    customerApp: "No — Apple/Google Wallet pass",
    lockIn: "None",
    free: "No",
    paid: "From $25/mo",
    rewards: "Stamp cards, up to 30 stamps, custom card art",
    summary: [
      "Loopy Loyalty delivers your stamp card as an Apple Wallet or Google Wallet pass, so there's no app to download — the card sits next to the customer's boarding passes and bank cards. Stamps are added by staff through a stamper app.",
      "It gives you a lot of design control — custom card art and up to 30 stamps per card — and supports multi-merchant programs (one card across several businesses). Plans start at $25/month.",
    ],
    pros: [
      "No customer app; native Wallet passes",
      "Deep card design and configuration options",
      "Supports multi-merchant and multi-location programs",
    ],
    cons: [
      "Every customer taps through a Wallet install dialog before their first stamp",
      "No free tier; $25/month minimum",
      "More to set up and maintain (card design, pass templates)",
    ],
  },
  {
    name: "Loyverse Loyalty",
    slug: "loyverse",
    bestFor: "Cafes already running Loyverse POS",
    customerApp: "Yes — Loyverse customer app",
    lockIn: "Loyverse POS required",
    free: "Yes — with Loyverse POS",
    paid: "Free basics; paid add-ons per outlet",
    rewards: "Points per dollar, pooled across outlets",
    summary: [
      "Loyverse is a free POS with a loyalty feature built in. If you already run Loyverse, its loyalty program costs you nothing extra to switch on, and customer points pool across all your outlets automatically.",
      "Customers track their points through the Loyverse customer app, and the program lives inside the POS — move to a different POS and the loyalty data goes with it. Advanced reporting and multi-outlet features sit behind paid add-ons charged per outlet.",
    ],
    pros: [
      "Free if you already use Loyverse POS",
      "Points tied to real sales, so hard to game",
      "Shared customer points across locations",
    ],
    cons: [
      "Customers install the Loyverse app",
      "Only works on Loyverse POS",
      "Paid add-ons for richer reporting and multi-outlet support",
    ],
  },
  {
    name: "PunchPass",
    slug: "punchpass",
    bestFor: "Cafes wanting a simple app-free card with flexible rewards",
    customerApp: "No — runs in the browser",
    lockIn: "None",
    free: "Not publicly stated",
    paid: "Contact for pricing",
    rewards: "Free coffee, % off, free item",
    summary: [
      "PunchPass sits in the same lane as Brewstamp: a simple digital stamp card for cafes that customers use in the browser, no app required. It advertises a wider choice of rewards out of the box — free coffee, percentage discounts, or a free item.",
      "When we last reviewed it, its public website didn't list pricing or a free tier, so you'll need to contact them for a quote. That's not a mark against the product, but it does make like-for-like comparison harder.",
    ],
    pros: [
      "No customer app",
      "More reward types out of the box",
      "Simple, cafe-focused product",
    ],
    cons: [
      "Pricing and free tier not published",
      "Per-stamp approval and setup time not stated publicly",
    ],
  },
  {
    name: "Smile.io",
    slug: "smile-io",
    bestFor: "Roasters and cafes that sell online through Shopify",
    customerApp: "No — website widget",
    lockIn: "Needs an e-commerce store",
    free: "Yes — capped order volume",
    paid: "$49+/mo + store platform fees",
    rewards: "Points, VIP tiers, referrals",
    summary: [
      "Smile.io is one of the best-known loyalty platforms for online stores — points, referrals and VIP tiers that plug into Shopify, BigCommerce or Wix. If you sell beans, merch or subscriptions online, it's genuinely strong.",
      "It isn't built for the counter, though. There's no native in-store stamping flow, it needs an e-commerce store to live on, and paid plans start around $49/month and scale with order volume. Plenty of roasters run Smile.io online and a stamp card in-store.",
    ],
    pros: [
      "Excellent for online sales: points, referrals, VIP tiers",
      "Free plan for low order volume",
      "Big ecosystem of e-commerce integrations",
    ],
    cons: [
      "Not designed for in-store stamping at a cafe counter",
      "Requires an e-commerce store",
      "Paid plans scale with order volume",
    ],
  },
];

// Single source of truth for the FAQ — drives both the visible accordion and
// the FAQPage structured data below, so they can never drift apart.
const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the best coffee shop loyalty app?",
    a: "For most independent cafes, the best coffee shop loyalty app is one customers don&apos;t have to download, with a flat price and a free way to test it. If you already run Square or Loyverse POS, their built-in loyalty is worth considering first. If you sell mostly online, look at Smile.io. For a single counter-first cafe, a browser-based stamp card like Brewstamp is the simplest fit.",
  },
  {
    q: "Is there a free cafe loyalty app?",
    a: `Yes, with caveats. Brewstamp is free for your first ${FREE_STAMPS} stamps, then $7/month. Loyverse&apos;s loyalty feature is free if you use Loyverse POS. Smile.io has a free plan for low online order volume. Stamp Me offers a 30-day trial rather than a free plan.`,
  },
  {
    q: "Do customers need to download an app for a coffee loyalty program?",
    a: "Not necessarily. Stamp Me and Loyverse ask customers to install an app. Brewstamp and PunchPass run in the phone browser after a QR scan, and Loopy Loyalty uses Apple and Google Wallet passes. App-free options get far more sign-ups at the counter, because nobody installs an app to save the price of a flat white.",
  },
  {
    q: "What's the difference between a coffee rewards app and a coffee rewards card?",
    a: "In practice they&apos;re the same thing. A &quot;coffee rewards card&quot; is the card a customer collects stamps on; a &quot;coffee rewards app&quot; is the software that runs it. With a browser-based system, the digital rewards card is what the customer sees and the app is the dashboard the cafe uses.",
  },
  {
    q: "Should my loyalty app connect to my POS?",
    a: "Only if you&apos;re committed to that POS. POS-integrated loyalty (Square, Loyverse) stamps automatically from the sale, which is convenient, but it locks your loyalty program and customer list to that system. A standalone app works with any card terminal and survives a POS switch, at the cost of one extra scan at the counter.",
  },
  {
    q: "How much does a cafe loyalty app cost per month?",
    a: "Based on public pricing when we last reviewed (May 2026): Brewstamp is free to start then $7/month, Loopy Loyalty starts at $25/month, Stamp Me at $29/month, Square Loyalty around $45/month on top of Square fees, and Smile.io paid plans around $49/month. Prices change, so always check each provider&apos;s own site.",
  },
];

// Strip inline HTML + decode the handful of entities we use, so the FAQPage
// schema carries clean plain-text answers (what Google expects).
const faqPlain = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+→/g, "")
    .trim();

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: faqPlain(f.a) },
  })),
};

export default function BlogPost() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-28 pb-16">
        <article>
          <header className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Comparison
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              The Best Coffee Shop Loyalty Apps in 2026, Compared
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Seven cafe loyalty apps side by side — which ones make your
              customers download something, which ones lock you into a POS,
              what they cost, and which kind of coffee shop each one actually
              suits.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-10-21">21 Oct 2026</time>
            </p>
          </header>

          {/* Featured-snippet answer */}
          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              In short
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              The best coffee shop loyalty app depends on your setup. On Square
              POS, Square Loyalty keeps everything in one place. On Loyverse
              POS, its built-in loyalty is free. Selling mostly online,
              Smile.io is the strongest. For an independent cafe that wants a
              stamp card customers use without downloading anything, a
              browser-based app like Brewstamp (free for the first{" "}
              {FREE_STAMPS} stamps, then $7/mo) or PunchPass is the simplest
              fit.
            </p>
          </div>

          {/* Hero image */}
          <figure className="mb-14">
            <img
              src={HERO}
              alt="Modern cafe interior with a coffee counter and seating"
              className="w-full rounded-2xl"
              loading="eager"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              Photo on Pexels.
            </figcaption>
          </figure>

          {/* Section — How we compared */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How we compared these coffee loyalty apps
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              We make Brewstamp, so we&apos;re not neutral — and we&apos;d
              rather say so up front than dress this up as an independent
              review. What we can do is be specific. Every competitor fact
              below comes from that product&apos;s own public website, last
              reviewed in May 2026, and where a site doesn&apos;t say something
              we&apos;ve written &quot;not stated&quot; rather than guess.
              Prices are the starting public prices; check each site before
              you sign up, because they change.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              We judged every cafe loyalty app on the things that actually
              decide whether a loyalty program works in a busy coffee shop:
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  b: "Does the customer have to install anything?",
                  t: "Every extra step between “scan” and “stamp” loses people. An app download loses the most.",
                },
                {
                  b: "Is it tied to a POS or store?",
                  t: "POS-integrated loyalty is convenient, but your program and customer list go wherever the POS goes.",
                },
                {
                  b: "Can you try it for free?",
                  t: "A real free tier lets you find out whether loyalty moves your numbers before you commit to another subscription.",
                },
                {
                  b: "What does it cost once you're running?",
                  t: "Flat monthly pricing beats per-transaction or volume-based pricing for a cafe doing hundreds of coffees a week.",
                },
                {
                  b: "Does the reward model fit a cafe?",
                  t: "For a shop selling mostly coffee, stamps toward a free drink are easier to explain at the counter than points.",
                },
              ].map(({ b, t }) => (
                <li
                  key={b}
                  className="flex gap-3 text-base leading-relaxed text-stone-600"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>
                    <strong className="text-stone-800">{b}</strong> {t}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section — Comparison table */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Coffee shop loyalty apps at a glance
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The short version, before the detail. Scroll the table sideways on
              a phone.
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-stone-100">
                  <tr>
                    {[
                      "App",
                      "Customer app?",
                      "POS / store lock-in",
                      "Free option",
                      "Starting paid price",
                      "Reward style",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 font-semibold text-stone-700"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {APPS.map((app) => (
                    <tr key={app.name} className="bg-white align-top">
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {app.name}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {app.customerApp}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{app.lockIn}</td>
                      <td className="px-4 py-3 text-stone-600">{app.free}</td>
                      <td className="px-4 py-3 text-stone-600">{app.paid}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {app.rewards}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-stone-400">
              Prices are starting public prices from each provider&apos;s
              website, last reviewed May 2026. Brewstamp prices are in USD.
            </p>
          </section>

          {/* Section — Per-app reviews */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The 7 best cafe loyalty apps, reviewed
            </h2>
            <div className="mt-8 space-y-12">
              {APPS.map((app, i) => (
                <div key={app.name}>
                  <h3 className="text-xl font-bold tracking-tight text-stone-900">
                    {i + 1}. {app.name}
                  </h3>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-amber-700">
                    Best for: {app.bestFor}
                  </p>
                  {app.summary.map((para) => (
                    <p
                      key={para}
                      className="mt-4 text-base leading-relaxed text-stone-600"
                    >
                      {para}
                    </p>
                  ))}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-stone-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                        Strengths
                      </p>
                      <ul className="mt-3 space-y-2">
                        {app.pros.map((p) => (
                          <li
                            key={p}
                            className="flex gap-3 text-sm leading-relaxed text-stone-600"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                        Trade-offs
                      </p>
                      <ul className="mt-3 space-y-2">
                        {app.cons.map((c) => (
                          <li
                            key={c}
                            className="flex gap-3 text-sm leading-relaxed text-stone-600"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-stone-300" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-stone-600">
                    {app.slug ? (
                      <Link
                        href={`/alternatives/${app.slug}`}
                        className="font-medium text-amber-700 underline-offset-4 hover:underline"
                      >
                        Full Brewstamp vs {app.name} comparison →
                      </Link>
                    ) : (
                      <Link
                        href="/cafe-loyalty-app"
                        className="font-medium text-amber-700 underline-offset-4 hover:underline"
                      >
                        See how the Brewstamp cafe loyalty app works →
                      </Link>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section — How to choose */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How to choose a coffee shop loyalty app
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Most cafes can narrow the field to one or two options by
              answering four questions in order:
            </p>
            <ol className="mt-6 space-y-4">
              {[
                {
                  b: "Which POS are you on, and will you stay on it?",
                  t: "If you run Square or Loyverse and plan to stay, try their built-in loyalty first — automatic stamping from the sale is a real convenience. If you might switch, or you use a plain card terminal, pick a standalone app so your program and customer list aren't tied to the till.",
                },
                {
                  b: "Do you sell much online?",
                  t: "If online orders, bean subscriptions or merch are a big slice of revenue, Smile.io is built for that. For a counter-first cafe it's the wrong shape — and you can always run a stamp card in-store alongside it.",
                },
                {
                  b: "Will your customers download an app?",
                  t: "Be honest. Regulars at a busy independent cafe mostly won't. If enrolment matters more than push notifications, go app-free: a browser card (Brewstamp, PunchPass) or a Wallet pass (Loopy Loyalty).",
                },
                {
                  b: "What do you need beyond stamps?",
                  t: "Push and SMS marketing, counter hardware and gamification point to Stamp Me. Deep card design and multi-merchant programs point to Loopy Loyalty. Points-per-dollar and VIP tiers point to Square, Loyverse or Smile.io. If all you want is “buy 8, get one free” done well, the simplest tool wins.",
                },
              ].map(({ b, t }, i) => (
                <li
                  key={b}
                  className="flex gap-4 text-base leading-relaxed text-stone-600"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">
                    <strong className="text-stone-800">{b}</strong> {t}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              Whichever coffee loyalty app you pick, the reward design matters
              as much as the software. Our guide to{" "}
              <Link
                href="/blog/coffee-shop-loyalty-cards"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                coffee shop loyalty cards that actually work
              </Link>{" "}
              covers rewards and program ideas, and{" "}
              <Link
                href="/blog/how-many-stamps-for-a-free-coffee"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                how many stamps to ask for
              </Link>{" "}
              covers the threshold.
            </p>
          </section>

          {/* Section — Quick picks */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Our quick picks by type of cafe
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  tag: "Independent cafe",
                  title: "Brewstamp or PunchPass",
                  text: "App-free stamp cards that work with any POS. Brewstamp publishes its pricing and has a free tier; PunchPass offers more reward types.",
                },
                {
                  tag: "Already on Square",
                  title: "Square Loyalty",
                  text: "Points from every sale, reporting in one place. Worth the higher price if you're staying on Square.",
                },
                {
                  tag: "Already on Loyverse",
                  title: "Loyverse Loyalty",
                  text: "Free with the POS and pools points across outlets — as long as your customers will install the app.",
                },
                {
                  tag: "Marketing-heavy multi-site",
                  title: "Stamp Me or Loopy Loyalty",
                  text: "Push and SMS, counter hardware, deep card design and multi-merchant programs, at a higher monthly price.",
                },
                {
                  tag: "Roaster selling online",
                  title: "Smile.io",
                  text: "Points, referrals and VIP tiers for your online store. Pair it with a stamp card at the counter.",
                },
                {
                  tag: "Office coffee perk",
                  title: "Brewstamp perk mode",
                  text: "Employer-subsidised staff coffee from the same QR code, on the Plus and Max plans.",
                },
              ].map(({ tag, title, text }) => (
                <div
                  key={tag}
                  className="rounded-xl border border-stone-200 bg-white p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                    {tag}
                  </p>
                  <h3 className="mt-2 font-semibold text-stone-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Frequently asked questions
            </h2>
            <div className="mt-6 space-y-6">
              {FAQS.map(({ q, a }) => (
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
                  <p
                    className="mt-3 text-sm leading-relaxed text-stone-500"
                    dangerouslySetInnerHTML={{ __html: a }}
                  />
                </details>
              ))}
            </div>
          </section>

          {/* Read next */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Read next
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/cafe-loyalty-app"
                className="group block rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Product
                </p>
                <h3 className="mt-2 font-semibold text-stone-900 group-hover:text-amber-800">
                  The cafe loyalty app with no customer download
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  Customers scan a QR code and collect stamps in the browser.
                </p>
              </Link>
              <Link
                href="/coffee-rewards-app"
                className="group block rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Product
                </p>
                <h3 className="mt-2 font-semibold text-stone-900 group-hover:text-amber-800">
                  The coffee rewards app for cafes
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  A digital rewards card with no app to download — scan, stamp,
                  free coffee.
                </p>
              </Link>
              <Link
                href="/alternatives"
                className="group block rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Compare
                </p>
                <h3 className="mt-2 font-semibold text-stone-900 group-hover:text-amber-800">
                  Brewstamp vs other loyalty apps
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  One-on-one feature and pricing comparisons for each app above.
                </p>
              </Link>
              <Link
                href="/blog/digital-loyalty-cards-for-cafes"
                className="group block rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Guide
                </p>
                <h3 className="mt-2 font-semibold text-stone-900 group-hover:text-amber-800">
                  Digital loyalty cards for cafes: the complete guide
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  How browser-based loyalty cards actually work in a busy cafe.
                </p>
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Try the app-free option in 2 minutes
            </h3>
            <p className="mt-2 text-stone-500">
              Free for your first {FREE_STAMPS} stamps. No app for your
              customers, no POS to connect. Print one QR code and you&apos;re
              running a real loyalty program.
            </p>
            <div className="mt-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Set up your shop
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
