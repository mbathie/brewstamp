import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Why Paper Loyalty Cards Don't Work Anymore",
  description:
    "Paper stamp cards lose customers, generate zero data, and are easy to fake. Here's why cafes are switching to digital.",
  alternates: {
    canonical: "/blog/why-paper-loyalty-cards-dont-work",
  },
  openGraph: {
    type: "article",
    url: "/blog/why-paper-loyalty-cards-dont-work",
    title:
      "Why Paper Loyalty Cards Don't Work Anymore (And What to Use Instead)",
    description:
      "Paper stamp cards lose customers, generate zero data, and are easy to fake. Here's why cafes are switching to digital.",
    images: [
      {
        url: "https://images.pexels.com/photos/6632853/pexels-photo-6632853.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Crumpled paper balls on a flat surface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Paper Loyalty Cards Don't Work Anymore",
    description:
      "Paper stamp cards lose customers, generate zero data, and are easy to fake. Here's why cafes are switching to digital.",
    images: [
      "https://images.pexels.com/photos/6632853/pexels-photo-6632853.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Why Paper Loyalty Cards Don't Work Anymore (And What to Use Instead)",
  description:
    "Paper stamp cards lose customers, generate zero data, and are easy to fake. Here's why cafes are switching to digital.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: { "@type": "ImageObject", url: "https://brewstamp.app/apple-touch-icon.png" },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/why-paper-loyalty-cards-dont-work",
  datePublished: "2026-02-27",
  dateModified: "2026-05-05",
  image:
    "https://images.pexels.com/photos/6632853/pexels-photo-6632853.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
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
              Opinion
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Why Paper Loyalty Cards Don&apos;t Work Anymore
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              You&apos;ve printed hundreds of them. Your customers have lost
              hundreds of them — usually in the same wallet that contains an
              expired Blockbuster card. Here&apos;s why the paper stamp card is
              costing you regulars, and what actually works in 2026.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-02-27">27 February 2026</time>
              {" · "}Updated <time dateTime="2026-05-05">5 May 2026</time>
            </p>
          </header>

          {/* Featured-snippet answer */}
          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              In short
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              Paper loyalty cards don&apos;t work because customers lose them
              (39% of paper loyalty card holders abandon the program for this
              reason alone), they&apos;re trivial to forge with a generic
              rubber stamp, they generate zero customer data, and they cost
              you a recurring print bill for a program you can&apos;t even
              measure. Digital loyalty cards solve all four problems at once.
            </p>
          </div>

          {/* Hero image */}
          <figure className="mb-14">
            <img
              src="https://images.pexels.com/photos/6632853/pexels-photo-6632853.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Crumpled paper balls on a flat surface"
              className="w-full rounded-2xl"
              loading="eager"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              Photo by Cup of Couple on Pexels.
            </figcaption>
          </figure>

          {/* Section 1 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The paper loyalty card was a great idea — in 2005
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The concept is sound: reward repeat customers and they&apos;ll
              keep coming back. Loyalty programs increase visit frequency by
              20-30% when they work. The problem isn&apos;t the concept —
              it&apos;s the medium.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Paper cards made sense when everyone carried a wallet full of
              cards. But behaviour has changed. People tap to pay, leave their
              wallet at home, and carry nothing but a phone. A paper stamp card
              doesn&apos;t fit into that world anymore.
            </p>
          </section>

          {/* Problem cards */}
          <section className="mb-14">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-stone-900">
              The four problems with paper
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  num: "1",
                  title: "They get lost",
                  text: "50–70% of loyalty cards are never redeemed — not because customers don't want the reward, but because the card has been swallowed by a couch or laundered into pulp. A customer with 6 stamps who washes their jeans does not start over. They quietly disengage and start cheating on you with the place across the street.",
                },
                {
                  num: "2",
                  title: "Zero data",
                  text: "You don't know how many active loyalty customers you have, how often they visit, when they last came in, or whether frequency is increasing. You're running a loyalty program with the dashboard equivalent of a tea towel.",
                },
                {
                  num: "3",
                  title: "Fraud is trivial",
                  text: "Anyone with a vaguely correct rubber stamp can fake a paper card, and eBay sells the generic ones for the price of a small latte. It only takes a handful of self-stamping regulars to make the program unprofitable.",
                },
                {
                  num: "4",
                  title: "Ongoing cost",
                  text: "Cards, stamps, ink pads, replacement stamps after one mysteriously goes home in a barista's apron. It's not huge, but it's recurring and annoying — especially for a program you can't actually measure.",
                },
              ].map(({ num, title, text }) => (
                <div
                  key={num}
                  className="relative rounded-xl border border-stone-200 bg-white p-6"
                >
                  <span className="absolute right-4 top-4 text-4xl font-bold text-stone-100">
                    {num}
                  </span>
                  <h3 className="text-lg font-semibold text-stone-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Image break */}
          <img
            src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-cafe-qr.jpg"
            alt="QR code printed out on a cafe counter"
            className="mb-14 w-full rounded-2xl"
          />

          {/* The solution */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What actually works: QR code loyalty
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The replacement for paper stamp cards is already in your
              customer&apos;s pocket: their phone.
            </p>
            <ol className="mt-6 space-y-4">
              {[
                "You put a QR code at the counter (print it once, done).",
                "Customers scan it with their phone camera — no app to download.",
                "You approve the stamp from your dashboard.",
                "The stamp appears on their digital card instantly. Their phone remembers their progress.",
              ].map((step, i) => (
                <li key={i} className="flex gap-4 text-base leading-relaxed text-stone-600">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* What it fixes */}
          <section className="mb-14 rounded-2xl bg-green-50 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What this fixes
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                {
                  bold: "No more lost cards.",
                  text: "The loyalty card lives on their phone. It's always there.",
                },
                {
                  bold: "Full visibility.",
                  text: "You can see every customer, every visit, every stamp.",
                },
                {
                  bold: "No fraud.",
                  text: "Every stamp requires your approval. No one can stamp themselves.",
                },
                {
                  bold: "No ongoing cost.",
                  text: "Print a QR code once. Done.",
                },
              ].map(({ bold, text }) => (
                <li
                  key={bold}
                  className="flex gap-3 text-base leading-relaxed text-stone-600"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  <span>
                    <strong className="text-stone-800">{bold}</strong> {text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Loyalty card image */}
          <div className="mb-14 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-700">
              What your customers see
            </p>
            <img
              src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-loyalty-card.png"
              alt="Example branded loyalty card on a phone"
              className="mx-auto w-full max-w-md rounded-2xl shadow-lg"
            />
          </div>

          {/* Objection */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              &quot;But won&apos;t customers miss the physical card?&quot;
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              This is the most common concern — and the answer is no. Nobody
              has ever cradled a damp punch card and whispered &quot;you and
              me, we&apos;ve been through a lot&quot;. Customers don&apos;t
              love paper cards; they tolerate them. What they love is the free
              coffee. Give them a faster way to earn it and they&apos;ll switch
              without blinking.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The first time a customer scans a QR code and sees their stamp
              appear in real time on their phone, the paper card feels
              ancient. It&apos;s the same feeling as the first time you tapped
              to pay instead of inserting your card.
            </p>
          </section>

          {/* Making the switch */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Making the switch
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              You don&apos;t need a dramatic cutover. Here&apos;s the simplest
              approach:
            </p>
            <ol className="mt-6 space-y-4">
              {[
                "Set up a digital loyalty card (takes about 2 minutes).",
                "Print the QR code and put it at the counter alongside your existing paper cards.",
                'Have your baristas mention it: "We\'ve gone digital — scan that QR code and your stamps are saved on your phone."',
                "After a week or two, once most regulars have switched, stop restocking the paper cards.",
              ].map((step, i) => (
                <li key={i} className="flex gap-4 text-base leading-relaxed text-stone-600">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              Most cafes find that within 2 weeks, 80%+ of their loyalty
              customers have moved to digital — without any push.
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Paper loyalty cards FAQ
            </h2>
            <div className="mt-6 space-y-6">
              {[
                {
                  q: "Are paper loyalty cards still effective?",
                  a: "Less than they used to be. Industry data shows roughly 39% of paper loyalty card holders abandon the program because they misplace the card, and 50–70% of paper cards are never redeemed. Digital loyalty cards retain virtually all of their members because the card lives on the customer's phone.",
                },
                {
                  q: "Why do paper stamp cards get lost so often?",
                  a: "They compete with credit cards and IDs for limited wallet space, they don't survive a wash cycle, and most customers don't carry a wallet at all anymore. A loyalty card pinned to a fridge magnet is a card that never makes it to the cafe.",
                },
                {
                  q: "Can paper loyalty cards be faked?",
                  a: "Easily. Any rubber stamp roughly the right shape will do, and generic stamps cost a few dollars on eBay. Without merchant approval at the moment of stamping, paper loyalty cards have effectively no fraud protection.",
                },
                {
                  q: "What's the best replacement for paper loyalty cards?",
                  a: "A digital loyalty card the customer accesses by scanning a QR code at the counter — no app required. The customer's stamps live on their phone, the merchant approves each stamp from a dashboard, and the cafe gets visibility into who their actual repeat customers are.",
                },
                {
                  q: "Do customers prefer digital loyalty cards over paper?",
                  a: "In most cases, yes. Customers don't love paper cards — they tolerate them. What they want is the reward. Switch to digital and most regulars adopt it within a single visit, especially if there's no app to install.",
                },
                {
                  q: "How much does it cost to switch from paper to digital?",
                  a: "Less than the paper cards typically cost. Most digital loyalty card platforms have a free tier; paid plans for small cafes run around $5–10/month — usually less than what you spend on printed cards and stamp pads in a year.",
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
                  <p className="mt-3 text-sm leading-relaxed text-stone-500">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Ditch the paper cards today
            </h3>
            <p className="mt-2 text-stone-500">
              Set up a digital loyalty card in 2 minutes. Free to start, no app
              download for your customers.
            </p>
            <div className="mt-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Create your free account
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
