import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Coffee Loyalty Card: Complete Guide for Cafes",
  description:
    "Everything cafe owners need to know about digital coffee loyalty cards — how they work, what they cost, and why digital outperforms paper.",
  alternates: {
    canonical: "/blog/digital-loyalty-cards-for-cafes",
  },
  openGraph: {
    type: "article",
    url: "/blog/digital-loyalty-cards-for-cafes",
    title: "Coffee Loyalty Card: The Complete Guide for Cafes (2026)",
    description:
      "How a digital coffee loyalty card works, how much it costs, and why cafes are switching from paper stamp cards.",
    images: [
      {
        url: "https://images.pexels.com/photos/30226644/pexels-photo-30226644.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Barista preparing coffee in a modern cafe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Loyalty Card: The Complete Guide for Cafes",
    description:
      "How a digital coffee loyalty card works, how much it costs, and why cafes are switching from paper stamp cards.",
    images: [
      "https://images.pexels.com/photos/30226644/pexels-photo-30226644.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Coffee Loyalty Card: The Complete Guide for Cafes (2026)",
  description:
    "How a digital coffee loyalty card works, what it costs, and why cafes are switching from paper stamp cards to a digital coffee loyalty card.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: { "@type": "ImageObject", url: "https://brewstamp.app/apple-touch-icon.png" },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/digital-loyalty-cards-for-cafes",
  image:
    "https://images.pexels.com/photos/30226644/pexels-photo-30226644.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
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
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Guide
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Coffee Loyalty Card: The Complete Guide for Cafes
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              The paper coffee loyalty card gets lost, forgotten, fed to a
              washing machine, or filed permanently inside a copy of <em>The
              Sopranos</em> box set. A digital coffee loyalty card fixes all of
              this — and it&apos;s easier to set up than you think.
            </p>
          </header>

          {/* Featured-snippet answer */}
          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              In short
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              A coffee loyalty card is a stamp-collection program that rewards
              customers with a free drink after a set number of purchases
              (commonly 8). A digital coffee loyalty card runs on the
              customer&apos;s phone — they scan a QR code at the counter to
              collect stamps, with no app to download. Digital coffee loyalty
              cards outperform paper because they can&apos;t be lost, can&apos;t
              be faked, and give the cafe usable customer data.
            </p>
          </div>

          {/* Hero image */}
          <figure className="mb-14">
            <img
              src="https://images.pexels.com/photos/30226644/pexels-photo-30226644.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Barista preparing coffee in a modern cafe"
              className="w-full rounded-2xl"
              loading="eager"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              Photo by Cemrecan Yurtman on Pexels.
            </figcaption>
          </figure>

          {/* Section 1 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What is a digital coffee loyalty card?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              A digital coffee loyalty card replaces the traditional paper stamp
              card with a phone-based version. Instead of carrying a physical
              coffee loyalty card and getting it stamped, your customers scan a
              QR code at the counter and collect stamps on their phone.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The key difference from a coffee loyalty card app like the ones
              big chains run: your customers don&apos;t need to download
              anything. The entire experience runs in their phone&apos;s
              browser. They scan, they see their card, they collect stamps.
            </p>
          </section>

          {/* Image break */}
          <img
            src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-cafe-qr.jpg"
            alt="QR code printed out on a cafe counter"
            className="mb-14 w-full rounded-2xl"
          />

          {/* Section 2 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why cafes are switching from paper to digital
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              If you&apos;ve ever fished a soggy stack of half-stamped cards
              out of your tip jar at 4pm, you already know the problem with
              paper. But the real cost goes deeper than the laminate:
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  bold: "Lost cards = lost regulars.",
                  text: "A customer with 7 out of 10 stamps who loses their card doesn't start over — they just stop caring about the program entirely.",
                },
                {
                  bold: "No data.",
                  text: "Paper cards tell you nothing about who your customers are, how often they visit, or when they stop coming.",
                },
                {
                  bold: "Fraud.",
                  text: "Any rubber stamp roughly the shape of a leaf can fake a paper card, and your most loyal customer is statistically also your best forger. Digital stamps require merchant approval, making them impossible to game.",
                },
                {
                  bold: "Printing costs add up.",
                  text: "Cards, ink pads, replacement stamps after the dog ate the last one — it's a small recurring expense that digital eliminates entirely.",
                },
              ].map(({ bold, text }) => (
                <li
                  key={bold}
                  className="flex gap-3 text-base leading-relaxed text-stone-600"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>
                    <strong className="text-stone-800">{bold}</strong> {text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How digital loyalty works in a cafe
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Here&apos;s what a typical transaction looks like:
            </p>
            <ol className="mt-6 space-y-4">
              {[
                "Customer walks up to the counter and orders their coffee.",
                "They scan the QR code on the counter with their phone camera — no app needed.",
                "A stamp request pops up on your dashboard. You tap approve.",
                "The stamp appears on their digital card in real time.",
                "After enough stamps (you set the number), they earn a free drink.",
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
              The entire process takes less than 5 seconds — about the time it
              takes to mishear someone&apos;s order as &quot;flat black&quot;.
              It doesn&apos;t slow down the queue, and it works on any phone
              with a camera — iPhone, Android, even the cracked old one your
              regular has been promising to replace since 2021.
            </p>
          </section>

          {/* Loyalty card image */}
          <div className="mb-14 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-600">
              What your customers see
            </p>
            <img
              src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-loyalty-card.png"
              alt="Example branded loyalty card on a phone"
              className="mx-auto w-full max-w-md rounded-2xl shadow-lg"
            />
          </div>

          {/* Section 4 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What to look for in a digital loyalty solution
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Not all digital loyalty platforms are built for small cafes. Many
              are designed for large chains and come with enterprise pricing to
              match. Here&apos;s what matters for independent cafes:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "No app download",
                  text: "Every extra step between your customer and their stamp is a customer lost. The best solutions work entirely in the browser.",
                },
                {
                  title: "Simple pricing",
                  text: "Avoid platforms that charge per transaction or take a percentage. Look for flat monthly fees or free tiers.",
                },
                {
                  title: "Quick setup",
                  text: "You should be able to go from sign-up to printed QR code in under 5 minutes.",
                },
                {
                  title: "Works without Wi-Fi",
                  text: "The QR code should open a web page, not require a specific app installed on the customer's phone.",
                },
              ].map(({ title, text }) => (
                <div
                  key={title}
                  className="rounded-xl border border-stone-200 bg-white p-5"
                >
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How much does a coffee loyalty card cost?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Pricing for a digital coffee loyalty card varies widely.
              Enterprise solutions like Stamp Me or Loyverse can run
              $30–100+/month. Simpler coffee loyalty card solutions built
              specifically for independent cafes are more affordable.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Brewstamp, for example, is a free coffee loyalty card for your
              first 100 stamps — enough to test if a loyalty program works for
              your shop. After that, it&apos;s $5/month for unlimited stamps.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How does a coffee loyalty card work in practice?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The best way to test a digital coffee loyalty card is to just try
              it. Most cafe owners are surprised how quickly their regulars
              adopt it — especially when there&apos;s nothing to download.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Print the QR code, stick it at the counter, and mention it when
              regulars order. You&apos;ll know within a week whether the coffee
              loyalty card is a fit for your cafe.
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Coffee loyalty card FAQ
            </h2>
            <div className="mt-6 space-y-6">
              {[
                {
                  q: "How does a coffee loyalty card work?",
                  a: "A customer collects a stamp each time they buy a coffee. After hitting a set threshold — most commonly 8 stamps — they earn a free drink. With a digital coffee loyalty card, the stamps are stored on the customer's phone after they scan a QR code at the counter.",
                },
                {
                  q: "What's the best coffee loyalty card for a small cafe?",
                  a: "For most independent cafes, a digital coffee loyalty card with no required app download is the strongest fit. It eliminates lost cards and stamp fraud, costs less than a paid POS-integrated loyalty platform, and customers don't need to install anything to use it.",
                },
                {
                  q: "Are coffee loyalty cards worth it?",
                  a: "Yes — when implemented well. Loyalty programs lift visit frequency 20–30% on average, and 75% of customers say they're more likely to return after receiving an incentive. The format matters: paper cards have a 50–70% loss rate, while digital coffee loyalty cards retain virtually all of their members.",
                },
                {
                  q: "How much does a digital coffee loyalty card cost?",
                  a: "Free or near-free for small cafes. Most browser-based digital coffee loyalty cards offer a free tier (typically up to ~100 stamps) and charge $5–10/month for unlimited stamps. Enterprise platforms like Stamp Me or Loyverse run $30–100+/month.",
                },
                {
                  q: "Do customers need an app for a coffee loyalty card?",
                  a: "Not with the right platform. Browser-based digital coffee loyalty cards open in the customer's phone browser when they scan the QR code — no App Store install, no account creation, no password. The card lives on a web page they can bookmark or save to their home screen.",
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
              Try a free coffee loyalty card — takes 2 minutes
            </h3>
            <p className="mt-2 text-stone-500">
              Set up your digital coffee loyalty card and print your QR code
              today.
            </p>
            <div className="mt-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-600 px-8 text-base hover:bg-amber-700"
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
