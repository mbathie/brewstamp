import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Coffee Shop Loyalty Card Printing — One QR Code, Free PDF",
  description:
    "How to print a coffee shop loyalty card the modern way — one A4 sheet with a QR code, not boxes of punch cards. Free PDF, print at home or at the printer, set up in 2 minutes.",
  alternates: { canonical: "/blog/coffee-shop-loyalty-card-printing" },
  openGraph: {
    type: "article",
    url: "/blog/coffee-shop-loyalty-card-printing",
    title:
      "Coffee Shop Loyalty Card Printing: Print One QR Code, Skip the Stack of Paper Cards",
    description:
      "Print one A4 sheet with a QR code instead of boxes of punch cards. Free, takes 2 minutes.",
    images: [
      {
        url: "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Cafe counter with a printed QR loyalty card",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Shop Loyalty Card Printing: One QR Code, Not Hundreds of Punch Cards",
    description:
      "Print one A4 sheet with a QR code instead of boxes of punch cards. Free, takes 2 minutes.",
    images: [
      "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Coffee Shop Loyalty Card Printing: Print One QR Code, Skip the Stack of Paper Cards",
  description:
    "How to print a coffee shop loyalty card the modern way — one A4 sheet with a QR code, not boxes of punch cards.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/coffee-shop-loyalty-card-printing",
  datePublished: "2026-05-14",
  dateModified: "2026-05-14",
  image:
    "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I print a coffee shop loyalty card?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If you're using a digital system like Brewstamp, you only print one thing — a single A4 sheet with your shop's QR code on it. Download the PDF from your dashboard, send it to any printer, tape it to the counter. Customers scan with their phone and the loyalty card opens in their browser. No stacks of punch cards to order or re-order.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a special printer for a loyalty card QR code?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Any standard inkjet or laser printer prints the QR code at A4 — the same paper you'd use for an invoice or a menu. Brewstamp's PDF is sized for A4 and US Letter and prints crisply at default settings.",
      },
    },
    {
      "@type": "Question",
      name: "What size should a printed loyalty card QR code be?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A 5cm × 5cm (2 inches) QR code scans reliably from arm's length. Brewstamp's printable PDF includes a larger version (around 8cm) plus call-out text so customers can see it from across the counter.",
      },
    },
    {
      "@type": "Question",
      name: "How much does it cost to print loyalty cards for a cafe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pre-printed paper punch cards usually run $30-80 per 500 cards, plus reorder costs every few months as customers lose them. A single QR sheet printed in-house costs less than a coffee.",
      },
    },
    {
      "@type": "Question",
      name: "Can I customize the printed loyalty card to match my cafe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — on Brewstamp you set your shop name, logo, and brand colors before downloading the PDF. The printed sheet uses those, so the QR poster matches your cafe's look.",
      },
    },
  ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-28 pb-16">
        <article>
          <header className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Guide
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Coffee shop loyalty card printing: print one QR code, skip
              the stack of paper cards
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Most guides on coffee shop loyalty card printing assume
              you&rsquo;ll order a few hundred glossy punch cards and pass
              them out at the counter. There&rsquo;s a faster, cheaper way:
              print one A4 sheet with a QR code and let your customers&rsquo;
              phones do the rest.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-05-14">14 May 2026</time>
            </p>
          </header>

          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The short version
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              You don&rsquo;t need to order pre-printed punch cards. With a
              digital loyalty platform you print <strong>one sheet</strong>{" "}
              — an A4 with your shop&rsquo;s QR code — and tape it to the
              counter. Customers scan, collect stamps in their browser, redeem
              a free drink when they&rsquo;re full. No reorders, no lost
              cards, no fake stamps.
            </p>
          </div>

          <figure className="mb-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cafe-loyalty-counter.jpg"
              alt="A printed Brewstamp QR loyalty card framed on a cafe counter as a customer scans it with their phone"
              className="aspect-[16/10] w-full rounded-2xl object-cover shadow-md ring-1 ring-stone-200"
              width={988}
              height={966}
            />
            <figcaption className="mt-3 text-center text-sm text-stone-400">
              One printed QR card on the counter — customers scan it with their
              phone, no app required.
            </figcaption>
          </figure>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The old way of printing loyalty cards
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              For decades cafes have done loyalty the same way: order 500 or
              1000 small punch cards from a local printer, sit them in a
              box behind the till, hand one out with each coffee. The
              printer charges $30 – $80 per batch, and you reorder every
              few months because customers lose theirs.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              That system has three quiet problems:
            </p>
            <ul className="mt-4 space-y-2 text-base leading-relaxed text-stone-600">
              <li className="flex gap-3">
                <span aria-hidden className="text-amber-700">•</span>
                <span>
                  <strong className="text-stone-900">Reorder churn.</strong>{" "}
                  Every reorder is a printing fee, a delivery wait, and a
                  weekend designing the artwork.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="text-amber-700">•</span>
                <span>
                  <strong className="text-stone-900">Lost cards.</strong>{" "}
                  A customer who&rsquo;s lost their 7-of-8 card silently stops
                  collecting — and you have no way to know.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="text-amber-700">•</span>
                <span>
                  <strong className="text-stone-900">No data.</strong> You
                  can&rsquo;t tell how often a regular comes in, who&rsquo;s
                  about to churn, or which days drive the most stamps.
                </span>
              </li>
            </ul>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              For a longer take on why paper systems struggle, see{" "}
              <Link
                href="/blog/why-paper-loyalty-cards-dont-work"
                className="font-medium text-amber-700 hover:underline"
              >
                Why paper loyalty cards don&rsquo;t work anymore
              </Link>
              .
            </p>
          </section>

          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The new way: print one QR poster
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              With a digital loyalty system like Brewstamp, the
              &ldquo;printing&rdquo; step takes 90 seconds. You log in, click
              the QR poster button, and your browser downloads an A4 PDF
              already styled with your shop name, your logo, and your brand
              colors. Print it on the office printer. Tape it to the counter.
              Done.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Customers point their phone camera at the QR. Their stamp card
              opens in their phone&rsquo;s browser — no app, no install, no
              account-creation form. They tap &ldquo;Request stamp&rdquo;,
              you approve from the dashboard, the stamp lands. It&rsquo;s a
              full{" "}
              <Link
                href="/coffee-rewards-app"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                coffee rewards app
              </Link>{" "}
              with nothing to print but that one poster.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How to print your loyalty card QR (step by step)
            </h2>
            <ol className="mt-6 space-y-4">
              {[
                "Sign up for a free Brewstamp account (no credit card). Takes about 30 seconds.",
                "In Shop Setup, set your shop name, upload a logo if you have one, and pick brand colors. The printable PDF picks them up automatically.",
                "Click \"Download QR PDF\" at the top of Shop Setup. You'll get an A4 (or US Letter) sheet with your QR, the words 'Buy 8, get 1 free' (or whatever your threshold is), and a small Brewstamp credit at the bottom.",
                "Print on any standard printer at default settings — colour if you have it, black-and-white works fine too. Tape, stand, or frame it on the counter.",
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
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Where to put the printed sheet
            </h2>
            <ul className="mt-4 space-y-3 text-base leading-relaxed text-stone-600">
              <li className="flex gap-3">
                <span aria-hidden className="text-amber-700">•</span>
                <span>
                  <strong className="text-stone-900">At the till.</strong>{" "}
                  The single best spot. Customers see it while their card is
                  being charged.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="text-amber-700">•</span>
                <span>
                  <strong className="text-stone-900">On takeaway bags or coffee sleeves.</strong>{" "}
                  A small printed sticker version of the QR. People scan it
                  on the walk to the office.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="text-amber-700">•</span>
                <span>
                  <strong className="text-stone-900">Next to the menu board.</strong>{" "}
                  Customers waiting in line have something to do.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="text-amber-700">•</span>
                <span>
                  <strong className="text-stone-900">In the window.</strong>{" "}
                  Catches passers-by who haven&rsquo;t come in yet. Pair it
                  with &ldquo;Loyal customers get every 8th coffee free.&rdquo;
                </span>
              </li>
            </ul>
          </section>

          <section className="mb-14 rounded-2xl border border-stone-200 bg-white p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Cost: paper punch cards vs. one QR sheet
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-stone-400">
                  Paper punch cards
                </p>
                <p className="mt-2 text-2xl font-bold text-stone-900">
                  ~$50 / 500 cards
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  Plus reorder every 3–6 months, plus design time, plus the
                  inevitable batch where the printer got the colour wrong.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                  One QR sheet
                </p>
                <p className="mt-2 text-2xl font-bold text-stone-900">
                  ~5¢ paper + ink
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  Lasts until it&rsquo;s scuffed up — usually months. Reprint
                  for the cost of one A4 sheet. The card itself never
                  &ldquo;runs out&rdquo; because customers carry it on their
                  phones.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Frequently asked questions
            </h2>
            <div className="mt-6 space-y-6">
              {faq.mainEntity.map(({ name, acceptedAnswer }) => (
                <details
                  key={name}
                  className="group rounded-xl border border-stone-200 bg-white px-6 py-5"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-stone-900">
                    {name}
                    <span className="ml-4 text-stone-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-stone-500">
                    {acceptedAnswer.text}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Print your QR loyalty card in 2 minutes
            </h3>
            <p className="mt-2 text-stone-500">
              Free up to 100 stamps. No customer app. Pick your colors,
              download the PDF, print, tape it up.
            </p>
            <div className="mt-6">
              <Link href="/try">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Try Brewstamp
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
