import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title:
    "Coffee Shop Loyalty Cards: Best Rewards & Setup Guide (2026)",
  description:
    "How a coffee shop loyalty card works, the 8-stamp rule, the rewards that actually keep customers coming back, and how to launch one in under 2 minutes.",
  alternates: {
    canonical: "/blog/coffee-shop-loyalty-cards",
  },
  openGraph: {
    type: "article",
    url: "/blog/coffee-shop-loyalty-cards",
    title:
      "Coffee Shop Loyalty Cards: Best Rewards & Setup Guide (2026)",
    description:
      "The best coffee shop loyalty card rewards, the 8-stamp rule, and how to set one up in under 2 minutes — without a customer app.",
    images: [
      {
        url: "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Barista handing a takeaway coffee cup to a customer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Coffee Shop Loyalty Cards: Best Rewards & Setup Guide (2026)",
    description:
      "The best coffee shop loyalty card rewards, the 8-stamp rule, and how to set one up in under 2 minutes — without a customer app.",
    images: [
      "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Coffee Shop Loyalty Cards: Best Rewards & Setup Guide (2026)",
  description:
    "The best coffee shop loyalty card rewards, the 8-stamp rule, and how to set one up in under 2 minutes — without a customer app.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/coffee-shop-loyalty-cards",
  datePublished: "2026-05-05",
  dateModified: "2026-05-29",
  image:
    "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

export default function BlogPost() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-28 pb-16">
        <article>
          <header className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Guide
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Coffee Shop Loyalty Cards: Best Rewards & Setup Guide
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Everything you need to know about coffee shop loyalty cards — how
              a loyalty card for a coffee shop actually works, what rewards
              regulars respond to, and why that warped little punch card living
              in someone&apos;s back pocket is quietly costing you customers.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-05-05">5 May 2026</time>
            </p>
          </header>

          {/* Featured-snippet answer */}
          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              In short
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              A coffee shop loyalty card rewards repeat customers with a free
              drink after they buy a set number — typically 8 — at the same
              cafe. The card can be a paper punch card, a digital card on the
              customer&apos;s phone, or a wallet pass in Apple Wallet or Google
              Wallet. Digital coffee shop loyalty cards outperform paper
              because they can&apos;t be lost, can&apos;t be faked, and give
              the cafe owner real customer data.
            </p>
          </div>

          {/* Hero image */}
          <figure className="mb-14">
            <img
              src="https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Barista handing a takeaway coffee cup to a customer at a coffee shop counter"
              className="w-full rounded-2xl"
              loading="eager"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              Photo by Kampus Production on Pexels.
            </figcaption>
          </figure>

          {/* Original data — E-E-A-T signal: lift this page above the
              generic round-up posts currently outranking it by showing
              we actually run loyalty programs at scale. */}
          <section className="mb-14 rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              From our own data
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              We run coffee shop loyalty cards for cafes across Australia,
              New Zealand, the UK, the US and beyond. What the numbers tell
              us about how a coffee shop loyalty card actually performs in
              the wild:
            </p>
            <ul className="mt-4 space-y-3 text-base leading-relaxed text-stone-600">
              <li className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>
                  Bondi-based{" "}
                  <Link
                    href="/blog/bennett-st-dairy-bondi"
                    className="font-medium text-amber-700 underline-offset-4 hover:underline"
                  >
                    Bennett St Dairy enrolled 863 customers in 7 months
                  </Link>{" "}
                  on a single A4 QR poster — no app, no plastic cards.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>
                  Daily regulars hit the 8-stamp threshold inside 2 weeks.
                  That&apos;s the cohort that pays the program back. Casual
                  customers take 6–12 weeks; many never hit it.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>
                  Roughly <strong className="text-stone-800">14% of enrolled customers</strong>{" "}
                  are actively scanning in any given week — the rest sit
                  dormant. That ratio is your true measure of program
                  health.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>
                  Cafes that switched from paper punch cards report a 50–70%
                  drop in &quot;lost card&quot; replacements — the cost
                  category nobody tracked because it was hidden in petty
                  cash and apologies.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 1 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What is a coffee shop loyalty card?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              A coffee shop loyalty card is a simple promise: come back enough
              times and your next coffee&apos;s on us. Traditionally that meant
              a paper punch card or stamp card the customer carried in their
              wallet. Today, a coffee shop loyalty card is more likely to live
              on a customer&apos;s phone — a digital version they pull up by
              scanning a QR code at the counter.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The mechanic is the same either way. The customer collects stamps
              for each purchase, hits a threshold (commonly 6, 8, or 10), and
              earns a free drink. The difference is in everything around it —
              loss rate, fraud, data, and whether your barista has to hunt for
              the rubber stamp every single time someone with a card walks in.
            </p>
          </section>

          {/* Section 2 — How it works */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How a loyalty card for a coffee shop works
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Whether it&apos;s a paper card or a digital card, the loop is the
              same:
            </p>
            <ol className="mt-6 space-y-4">
              {[
                "A customer orders a coffee at your shop.",
                "They collect a stamp — either a physical stamp on a paper card, or a digital stamp on their phone.",
                "When they hit the threshold (e.g. 8 stamps), they earn the reward.",
                "They redeem the reward on a future visit, then start a new card.",
              ].map((step, i) => (
                <li
                  key={i}
                  className="flex gap-4 text-base leading-relaxed text-stone-600"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              Digital coffee shop loyalty cards add a small but important step
              between 1 and 2: the merchant approves the stamp from a dashboard.
              That single change is what kills card-stuffing fraud — no one can
              quietly stamp themselves on the train home with a $4 rubber stamp
              they ordered off eBay.
            </p>
          </section>

          {/* Section 3 — Best rewards */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The best coffee shop loyalty card rewards
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Choosing the right reward is the most important decision you make
              when designing your loyalty program. Get it wrong and the program
              feels stingy or eats your margins. Get it right and you build the
              kind of habit that keeps regulars coming back six days a week.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Here are the coffee shop loyalty card rewards that actually move
              the needle, ranked by how well they perform in the wild:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Free coffee after 8 stamps",
                  text: "The classic. Simple, easy to explain, and the maths work for almost any cafe. 8 is the sweet spot — high enough to protect margin, low enough to feel attainable.",
                  tag: "Best overall",
                },
                {
                  title: "Free coffee + free pastry milestone",
                  text: 'Add a "10th visit gets a free pastry too" bonus on top of the standard reward. Makes regulars feel seen, costs you cents, and increases avg basket size.',
                  tag: "Best for upsell",
                },
                {
                  title: "Buy 5, get 1 (low threshold)",
                  text: "Use this for new shops trying to build a base. Easier to hit, so customers experience the win faster and form the habit earlier. Move to 8 once you have regulars.",
                  tag: "Best for launch",
                },
                {
                  title: "Free coffee + birthday bonus",
                  text: "Standard 8-stamp reward, plus a free coffee on their birthday. Generates word-of-mouth and gives you a reason to capture an email or phone number.",
                  tag: "Best for data",
                },
              ].map(({ title, text, tag }) => (
                <div
                  key={title}
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
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              <strong className="text-stone-800">Avoid percentage discounts.</strong>{" "}
              &quot;15% off your next order&quot; sounds generous but consistently
              underperforms a free coffee — even when the dollar value is
              identical. Nobody has ever told a friend &quot;you have to try
              this place, they do 15% off&quot;. People respond to{" "}
              <em>free</em>, not <em>cheaper</em>.
            </p>
          </section>

          {/* Section — Stamps vs points */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Stamps vs points: which is better for a coffee shop?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The two main coffee shop loyalty card formats are stamps (a
              stamp per visit, redeem at a fixed threshold) and points (points
              accumulate by spend, redeem at multiple tiers).
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              For a small or mid-sized coffee shop, <strong className="text-stone-800">stamps win almost every time</strong>.
              They&apos;re trivial to explain at the counter (&quot;buy 8, get
              one free&quot;), customers can mentally track their progress
              without opening anything, and they punish heavy discounters less
              than points-based systems.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Points-based programs make sense when you have multiple
              redemption tiers (free coffee, free pastry, free merch) or a
              wide product range with very different prices. For a cafe doing
              80% coffee, that&apos;s overengineering a problem stamps already
              solved in 1985.
            </p>
          </section>

          {/* Section 4 — Punch vs digital */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Coffee shop punch card vs digital loyalty card
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The paper coffee shop punch card has been the default for thirty
              years. It&apos;s familiar, cheap to print, and customers
              understand it instantly. So why are most coffee shops switching
              away from it?
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-stone-700">
                      Factor
                    </th>
                    <th className="px-4 py-3 font-semibold text-stone-700">
                      Paper punch card
                    </th>
                    <th className="px-4 py-3 font-semibold text-stone-700">
                      Digital loyalty card
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {[
                    [
                      "Lost cards",
                      "50–70% never redeemed",
                      "Lives on the phone — can&apos;t be lost",
                    ],
                    [
                      "Fraud",
                      "Trivial to fake with a similar stamp",
                      "Each stamp requires merchant approval",
                    ],
                    [
                      "Customer data",
                      "None",
                      "Visit frequency, churn, top customers",
                    ],
                    [
                      "Ongoing cost",
                      "Cards, ink, replacements",
                      "Print the QR code once",
                    ],
                    [
                      "Setup time",
                      "Order cards, wait for delivery",
                      "Under 2 minutes",
                    ],
                  ].map(([factor, paper, digital]) => (
                    <tr key={factor} className="bg-white">
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {factor}
                      </td>
                      <td
                        className="px-4 py-3 text-stone-600"
                        dangerouslySetInnerHTML={{ __html: paper }}
                      />
                      <td
                        className="px-4 py-3 text-stone-600"
                        dangerouslySetInnerHTML={{ __html: digital }}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              The lost-card number is the killer. A customer with 7 of 8 stamps
              who puts the card through a hot wash does not, in fact, hand-press
              their pulpy denim souvenir flat and start collecting again. They
              just quietly disengage from the program forever. With a digital
              loyalty card for a coffee shop, that scenario simply can&apos;t
              happen.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              If you&apos;re still leaning toward paper, the recurring print
              cost adds up faster than most cafe owners realise — we broke
              that down in{" "}
              <Link
                href="/blog/coffee-shop-loyalty-card-printing"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                coffee shop loyalty card printing costs and templates
              </Link>
              , including free A4 templates if you want to test before
              switching to digital.
            </p>
          </section>

          {/* Section 5 — Picking the right one */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How to pick the best coffee shop loyalty card for your cafe
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Most digital loyalty platforms are built for chains with marketing
              budgets and IT teams, not for independent coffee shops.{" "}
              <Link
                href="/alternatives"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                We compare the most common cafe loyalty platforms here
              </Link>
              . But before that, here&apos;s what to look for in a coffee shop
              loyalty program if you&apos;re a small business:
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  bold: "No app download for customers.",
                  text: "If your customers need to install an app to use your coffee shop loyalty card, you&apos;ve already lost most of them. The whole point is friction-free.",
                },
                {
                  bold: "Real-time stamp approval.",
                  text: "The customer scans, you approve, the stamp lands. Avoid systems where stamps happen automatically — they&apos;re trivial to abuse.",
                },
                {
                  bold: "Flat pricing, not per-stamp.",
                  text: "Per-transaction pricing punishes you for being successful. Look for free tiers or a flat monthly fee.",
                },
                {
                  bold: "Customisable reward threshold.",
                  text: "You should be able to choose 6, 8, 10 — whatever fits your margin. Avoid platforms that force a specific number.",
                },
                {
                  bold: "Customer insights.",
                  text: "Even basic data — visit frequency, lapsed customers — is more than a paper card can ever tell you.",
                },
              ].map(({ bold, text }) => (
                <li
                  key={bold}
                  className="flex gap-3 text-base leading-relaxed text-stone-600"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>
                    <strong className="text-stone-800">{bold}</strong>{" "}
                    <span dangerouslySetInnerHTML={{ __html: text }} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 6 — Setup */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Setting up your first coffee shop loyalty card
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              You don&apos;t need a launch plan. The whole point of a loyalty
              card for a coffee shop is that it should fit into your existing
              workflow on day one. The minimum viable rollout:
            </p>
            <ol className="mt-6 space-y-4">
              {[
                "Pick a digital loyalty platform that doesn&apos;t require an app.",
                "Set your reward (free coffee) and threshold (8 stamps is a safe default).",
                "Print the QR code and place it next to the EFTPOS machine.",
                "Tell your baristas the one-line script: \"We&apos;ve got a digital loyalty card — scan that QR code, after 8 coffees the next one&apos;s free, no app needed.\"",
                "Watch the first week of data. If scan rates are low, move the QR code.",
              ].map((step, i) => (
                <li
                  key={i}
                  className="flex gap-4 text-base leading-relaxed text-stone-600"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span
                    className="pt-0.5"
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Frequently asked questions
            </h2>
            <div className="mt-6 space-y-6">
              {[
                {
                  q: "How many stamps should a coffee shop loyalty card require?",
                  a: "Eight is the most common threshold and works for most cafes. Six is friendlier for newer shops trying to build regulars; ten makes sense if your average drink price is lower or your margins are tight. <a href=\"/blog/how-many-stamps-for-a-free-coffee\" class=\"font-medium text-amber-700 underline hover:text-amber-800\">See the full breakdown of stamp thresholds and the maths behind each →</a>",
                },
                {
                  q: "What's the best reward for a coffee shop loyalty card?",
                  a: "A free regular coffee. It&apos;s simple to explain, has a clear perceived value, and consistently outperforms percentage discounts in customer testing.",
                },
                {
                  q: "Are digital coffee shop loyalty cards better than punch cards?",
                  a: "For most coffee shops, yes. Digital coffee shop loyalty cards eliminate lost cards and stamp fraud, give you customer data you can actually use, and remove the recurring cost of printing cards and stamp pads.",
                },
                {
                  q: "Do customers need to download an app to use a digital loyalty card?",
                  a: "Not with the right platform. Browser-based digital loyalty cards open a web page when the customer scans the QR code — no App Store, no install, no account creation.",
                },
                {
                  q: "How much does a coffee shop loyalty program cost?",
                  a: "Paper cards cost a few cents each plus stamps and ink. Digital coffee shop loyalty programs start free and typically cap at $5–10/month for unlimited stamps on small-business plans.",
                },
                {
                  q: "What's the difference between a coffee rewards card and a coffee loyalty card?",
                  a: "In practice, none. &quot;Coffee rewards card&quot; and &quot;coffee loyalty card&quot; describe the same thing — a card (paper or digital) that earns the customer a reward after a number of purchases. Some chains use &quot;rewards&quot; for points-based systems and &quot;loyalty&quot; for stamp-based, but the line is fuzzy and not worth defending.",
                },
                {
                  q: "Is there a good coffee rewards app or cafe loyalty app for independent shops?",
                  a: "Most coffee rewards apps are built for chains and require customers to download an app — which kills uptake in independent cafes. The simpler model is a browser-based digital loyalty card: customers scan a QR, get a stamp, no install. <a href=\"/alternatives\" class=\"font-medium text-amber-700 underline hover:text-amber-800\">See how the common cafe loyalty apps compare →</a>",
                },
                {
                  q: "How long does it take customers to fill a coffee shop loyalty card?",
                  a: "From our own data: daily regulars fill an 8-stamp card in about 2 weeks. Weekly-ish customers take 2 months. Casual visitors take 3+ months and many never finish. If you&apos;re seeing &lt;10% redemption rates after 90 days, the threshold may be too high or the reward too small.",
                },
              ].map(({ q, a }) => (
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
                href="/blog/why-paper-loyalty-cards-dont-work"
                className="group block rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Guide
                </p>
                <h3 className="mt-2 font-semibold text-stone-900 group-hover:text-amber-800">
                  Why paper loyalty cards don&apos;t work anymore
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  Lost cards, fraud, and zero data — the case for going digital.
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
                  Digital loyalty cards for cafes
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  How browser-based loyalty cards actually work in a busy cafe.
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
                  Honest feature and pricing comparisons against Stamp Me,
                  Loopy Loyalty, PunchPass, Square, Loyverse, and Smile.io.
                </p>
              </Link>
              <Link
                href="/blog/qr-code-loyalty-program"
                className="group block rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Guide
                </p>
                <h3 className="mt-2 font-semibold text-stone-900 group-hover:text-amber-800">
                  How QR-code loyalty programs work
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  The mechanic behind app-less loyalty: scan, approve, stamp.
                </p>
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Set up your coffee shop loyalty card in 2 minutes
            </h3>
            <p className="mt-2 text-stone-500">
              Free to start. No app for your customers. Print one QR code and
              you&apos;re running a real loyalty program.
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
