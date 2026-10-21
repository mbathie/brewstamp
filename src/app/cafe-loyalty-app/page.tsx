import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Printer,
  Tablet,
  Users,
  Store,
  BarChart3,
  Download,
  Languages,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { FREE_STAMPS, PUBLIC_PLANS } from "@/lib/plans";

// Owns the OPERATOR angle: running a loyalty program at the counter (QR at
// the till, approving stamps, staff logins, multiple shops, dashboard, CSV,
// languages, plan tiers) for "cafe loyalty app / card" and "coffee shop
// loyalty app". What the customer sees (the rewards card, wallet passes,
// reward design) lives on /coffee-rewards-app; the homepage owns "loyalty
// card / stamp card". Keep the three distinct so they don't compete.
export const metadata: Metadata = {
  title: {
    absolute: "Cafe Loyalty App for the Counter: Staff, Shops & Data | Brewstamp",
  },
  description:
    `Run your cafe loyalty card from the counter: a QR at the till, staff approve stamps on any device, and you see every regular. Free for your first ${FREE_STAMPS} stamps.`,
  alternates: { canonical: "/cafe-loyalty-app" },
  keywords: [
    "cafe loyalty app",
    "cafe loyalty card",
    "coffee shop loyalty app",
    "coffee loyalty app",
    "loyalty app for cafes",
    "cafe loyalty program software",
    "loyalty app for multiple cafes",
  ],
  openGraph: {
    type: "website",
    url: "/cafe-loyalty-app",
    title: "Cafe Loyalty App for the Counter: Staff, Shops & Data",
    description:
      "Customers scan a QR at the till, staff approve stamps on any phone or tablet, and you see every regular in one dashboard. No POS integration, no customer app.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cafe Loyalty App for the Counter: Staff, Shops & Data",
    description:
      "QR at the till, stamps approved on any phone or tablet, staff logins, multiple shops and a real customer list. No customer app.",
  },
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does the cafe loyalty app need a POS integration or special hardware?",
    a: "No. Brewstamp runs on the phone, tablet or laptop you already have behind the counter, alongside whatever till you use. Customers scan a printed QR code, the request appears on your screen, and you approve it. There's no scanner to buy and nothing to connect to your POS.",
  },
  {
    q: "How do staff approve stamps during a rush?",
    a: "A customer's stamp request pops up live on the dashboard. Staff tap Approve or Decline, and can award more than one stamp at once when someone buys a round. Unanswered requests expire after ten minutes, so a busy queue never leaves a pile of stale ones behind.",
  },
  {
    q: "Can my baristas have their own logins?",
    a: "Yes, on the Business plan. Invite people by email as staff or managers, so you're not sharing the owner's password across the team. Staff handle the counter; managers can also invite and manage staff.",
  },
  {
    q: "Can I run one loyalty program across several cafes?",
    a: "Yes. Business covers up to 3 shops under one account (contact us if you run more). Each shop gets its own QR code, branding, reward threshold and language, and cross-shop reporting rolls stamps, customers and redemptions into one view.",
  },
  {
    q: "Can I export my cafe's customer list?",
    a: "Yes. On the Business plan you can download your customers as a CSV — names, emails, stamps and rewards redeemed — for your own records or email tool. On every plan you can browse, search, tag and add notes to customers in the dashboard.",
  },
  {
    q: "What happens when I use up the free stamps?",
    a: `Free covers your first ${FREE_STAMPS} stamps with the full single-shop setup, no card details needed. When you reach the limit, the dashboard asks you to pick a plan before awarding more. Customers' existing stamps are kept. Pro is $12/month for unlimited stamps at one shop.`,
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
        "A cafe loyalty app for running a digital stamp card at the counter: customers scan a QR code at the till, staff approve stamps in real time on any device, and owners manage staff, multiple shops and customer data from one dashboard.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: `Free for your first ${FREE_STAMPS} stamps; paid plans from $12/month.`,
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

// Getting set up, from the operator's side.
const SETUP: Array<{ icon: typeof QrCode; title: string; body: string }> = [
  {
    icon: QrCode,
    title: "Create your shop",
    body: "Add your logo, colours, reward threshold and customer language. Your shop gets its own QR code straight away.",
  },
  {
    icon: Printer,
    title: "Print the QR for the till",
    body: "Download a branded, print-ready QR PDF — it carries your colours and the \"buy N, get one free\" headline in your language.",
  },
  {
    icon: Tablet,
    title: "Keep the dashboard open",
    body: "On the phone or tablet behind the counter. Stamp requests appear live; approve, and you're serving the next customer.",
  },
];

const OPERATOR_FEATURES: Array<{ icon: typeof Users; title: string; body: string }> = [
  {
    icon: ShieldCheck,
    title: "Every stamp approved by a person",
    body: "Customers request, your team approves. Nothing is self-served, so there are no stamps from screenshots or a borrowed stamper.",
  },
  {
    icon: Users,
    title: "Staff and manager logins",
    body: "Invite your team by email with their own roles instead of sharing one password. One staff login on Pro, unlimited on Business.",
  },
  {
    icon: Store,
    title: "Multiple shops, one account",
    body: "Run up to 3 shops on Business (more on request), each with its own QR, branding and threshold, plus cross-shop reporting.",
  },
  {
    icon: BarChart3,
    title: "A live view of your regulars",
    body: "Activity with date-range filters, a searchable customer list, notes, tags and a top-customer badge on incoming requests.",
  },
  {
    icon: Download,
    title: "Your customer data, exportable",
    body: "Download names, emails, stamps and rewards redeemed as a CSV on the Business plan. The list belongs to your cafe.",
  },
  {
    icon: Languages,
    title: "14 customer languages",
    body: "Set the language per shop. The customer card, wallet passes and printed QR all switch, including right-to-left Arabic.",
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
            The cafe loyalty app that runs from your counter
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-500">
            A QR code at the till, stamp requests on the phone or tablet you
            already have, and one dashboard for your staff, your shops and your
            regulars. No POS integration, no scanner, and no app for customers
            to download. Free for your first {FREE_STAMPS}{" "}stamps.
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

        {/* A shift at the counter */}
        <section className="mx-auto w-full max-w-3xl px-6 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            What a shift looks like with a digital cafe loyalty card
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Loyalty software is only as good as its worst moment at the till:
            a queue out the door, one barista on the machine, and a customer
            holding up their phone. Brewstamp is built around that moment, not
            around a marketing dashboard.
          </p>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Your QR code sits by the register. A customer scans it, their card
            opens in the browser, and they tap to request a stamp. On your
            screen a request appears straight away with their name or nickname (and a{" "}
            <em>Top customer</em> badge if they&apos;re one of your regulars).
            Tap Approve and the stamp lands on their card before you&apos;ve
            finished steaming the milk. If they bought a round for the office,
            bump the count and award several stamps at once. If something looks
            off, Decline. Requests nobody answers expire after ten minutes.
          </p>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            When a card is full, the customer asks for their reward from the
            same screen and you see a clear &ldquo;wants to redeem a
            reward&rdquo; request, so there&apos;s no squinting at a crumpled
            punch card to count the holes. A regular without a smartphone? Add
            them by name and email from the dashboard and stamp their card
            yourself.
          </p>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            None of this touches your POS. Brewstamp runs next to whatever till
            you already use, so there&apos;s no integration project and nothing
            to break when you change payment providers.
          </p>
        </section>

        {/* Setup */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
              Set up your cafe loyalty app before the next rush
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {SETUP.map((s) => (
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
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-stone-500">
              Step-by-step guides:{" "}
              <Link
                href="/blog/set-up-your-brewstamp-shop"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                set up your Brewstamp shop in 5 minutes
              </Link>{" "}
              and{" "}
              <Link
                href="/blog/coffee-shop-loyalty-card-printing"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                print your loyalty QR code
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Operator features */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
            Everything you need to run a loyalty program behind the counter
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OPERATOR_FEATURES.map((f) => (
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

        {/* Staff + multi-shop */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-3xl px-6">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Staff logins and multiple cafes
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              A single-owner cafe can run Brewstamp from one login. Once you
              have a team, sharing that login gets messy: everyone knows the
              password, and nobody can tell who approved what. On the Business
              plan you invite people by email and give each one a role. Staff
              approve stamps at the counter; managers can also invite and
              manage staff, so the owner isn&apos;t the bottleneck for every
              new hire.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Growing past one location works the same way. Each cafe is its
              own shop with its own QR code, branding, reward threshold and
              customer language, so a shop in a tourist area can serve
              customers in a different language from your original site.
              Cross-shop reporting rolls stamps, customers and redemptions into
              a single view, and customers who visit more than one of your
              shops can switch between their cards. More detail in{" "}
              <Link
                href="/blog/multiple-shops-and-team-logins"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                multi-shop and team logins
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Customer data */}
        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            The customer list a paper cafe loyalty card never gave you
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            A paper card tells you nothing. You don&apos;t know how many are
            out there, who&apos;s close to a free coffee, or which regular
            quietly stopped coming in. With a digital cafe loyalty card, every
            approved stamp is a data point you own:
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "A live activity view of stamps and redemptions, filterable by date range",
              "A searchable customer list with each person's stamps, lifetime total and rewards redeemed",
              "Private notes and tags on any customer — \"oat flat white\", \"wholesale\", \"staff\"",
              "Turn off a card at one shop if someone is misusing it",
              "CSV export of names, emails, stamps and rewards on the Business plan",
              "Automatic emails: a welcome for you, a note when your first customer joins, and gentle re-engagement",
            ].map((item) => (
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
            Customers start out anonymous and can add a name and email after
            their first stamp, so your list grows without a signup form at the
            till. Curious what that card looks like from the other side,
            including Apple Wallet and Google Wallet passes and how to set the
            free-coffee threshold? See{" "}
            <Link
              href="/coffee-rewards-app"
              className="text-amber-700 underline-offset-2 hover:underline"
            >
              the coffee rewards card your customers get
            </Link>
            .
          </p>
        </section>

        {/* Plans */}
        <section className="bg-white py-16">
          <div className="mx-auto w-full max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
              Cafe loyalty app pricing: pick the plan that fits your counter
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-stone-600">
              Start free for your first {FREE_STAMPS}{" "}stamps, no card
              details. Upgrade when you need unlimited stamps, a team or more
              shops. Prices in USD; annual billing gets you two months free.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PUBLIC_PLANS.map((p) => (
                <div
                  key={p.slug}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-6"
                >
                  <h3 className="text-base font-semibold text-stone-900">
                    {p.label}
                  </h3>
                  <p className="text-sm text-stone-500">{p.tagline}</p>
                  <p className="mt-3 text-2xl font-bold text-stone-900">
                    {p.priceLabel}
                    {p.priceCents > 0 && (
                      <span className="text-sm font-normal text-stone-500">
                        /month
                      </span>
                    )}
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm leading-relaxed text-stone-600"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-700" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
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
                Coffee rewards app: the card and wallet pass your customers see →
              </Link>
            </li>
            <li>
              <Link
                href="/blog/multiple-shops-and-team-logins"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                Multi-shop, team logins and plans →
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
                Digital loyalty cards for cafes: the complete guide →
              </Link>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-20">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-stone-900">
              Run your cafe loyalty program from the counter
            </h2>
            <p className="mt-2 text-stone-500">
              Set up your shop, print one QR code, and approve your first stamp
              today. Free for your first {FREE_STAMPS}{" "}stamps — no app for
              anyone to download.
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
