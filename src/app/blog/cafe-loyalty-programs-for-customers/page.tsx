import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  // SERP-tuned: lead with the implicit answer ("Yes —") and the payoff
  // ("free coffee") to pull clicks at the page-1 position the post already
  // holds. Description doubles down without burying the lede.
  title:
    "Does This Cafe Have a Loyalty Program? Yes — Here's How to Find It and Earn Free Coffee",
  description:
    "Most cafes now run a digital loyalty card. Look for a QR code at the counter, scan it with your phone — no app needed — and start collecting stamps toward a free drink. Here's exactly how it works.",
  alternates: { canonical: "/blog/cafe-loyalty-programs-for-customers" },
  openGraph: {
    type: "article",
    url: "/blog/cafe-loyalty-programs-for-customers",
    title: "Does This Cafe Have a Loyalty Program? Yes — Here's How to Find It and Earn Free Coffee",
    description:
      "Look for a QR code at the counter, scan it with your phone (no app needed), and start collecting stamps toward a free drink. Here's exactly how it works.",
    images: [
      {
        url: "https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Customer scanning a QR code at a cafe counter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Does This Cafe Have a Loyalty Program? Yes — Here's How to Earn Free Coffee",
    description:
      "Scan the QR code at the counter, no app needed, start collecting stamps toward a free drink.",
    images: [
      "https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Does This Cafe Have a Loyalty Program? How Digital Stamp Cards Work",
  description:
    "Most cafes now run digital loyalty programs — scan a QR code, collect stamps, redeem free coffee. Here's how to spot them and start earning rewards.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage:
    "https://brewstamp.app/blog/cafe-loyalty-programs-for-customers",
  datePublished: "2026-05-11",
  dateModified: "2026-05-11",
  image:
    "https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How can I tell if a cafe has a loyalty program?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Look for a QR code at the counter or on the menu — usually small, square, and labelled 'loyalty card', 'stamp card', or 'rewards'. If you don't see one, ask the barista; many cafes have one but don't advertise it on the wall.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to download an app to use a coffee loyalty card?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On modern systems like Brewstamp — no. You scan a QR code with your phone's built-in camera and your stamp card opens in the browser. Older programs (the big chains) often still require their branded app.",
      },
    },
    {
      "@type": "Question",
      name: "How many stamps do I usually need for a free coffee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most independent cafes use a 'buy 8, get 1 free' or 'buy 10, get 1 free' rule. Some shops set their own threshold — it's shown on the card when you sign up.",
      },
    },
    {
      "@type": "Question",
      name: "Will I get spammed if I sign up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On Brewstamp specifically, no. You only get an optional email when you've earned a free drink. Other systems may send marketing — check before you hand over your email.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if I switch phones?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If you've added your email or name to the card, your progress is tied to that account and follows you to any device. If you signed up anonymously (just a cookie), you'd lose your stamps — so it's worth adding a name and email at the first stamp.",
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
              For customers
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Does this cafe have a loyalty program?
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Short answer: probably yes — and earning a free coffee is usually
              two taps away. Here&rsquo;s how digital cafe loyalty cards work
              from the customer&rsquo;s side, what to look for at the counter,
              and how to make sure your stamps actually count.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-05-11">11 May 2026</time>
            </p>
          </header>

          <figure className="mb-14 rounded-2xl bg-stone-100 px-6 py-8">
            <img
              src="https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&w=940&h=600&fit=crop"
              alt="Customer scanning a QR code at a cafe counter"
              className="mx-auto w-full max-w-2xl rounded-xl"
              loading="lazy"
            />
            <figcaption className="mt-4 text-center text-xs text-stone-400">
              Most modern cafe loyalty cards live behind a QR code — no app
              download needed.
            </figcaption>
          </figure>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How to tell if a cafe has a loyalty program
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The most obvious clue is a small <strong>QR code</strong> at the
              counter, on the menu, or stuck near the till. Look for words like{" "}
              <em>stamp card</em>, <em>loyalty</em>, or <em>rewards</em> next
              to it. If you don&rsquo;t see one — just ask. A lot of cafes
              have signed up to digital programs but haven&rsquo;t put up
              prominent signage yet.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The older option — a paper card you punch on each visit — is
              fading out fast. Most cafes that still hand them out now run a
              digital version too, and the digital one&rsquo;s easier (no
              wallet to dig out, no torn cards, your stamps never get lost).
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How digital stamp cards work
            </h2>
            <ol className="mt-6 space-y-4">
              {[
                "Point your phone camera at the QR code. Your stamp card opens in the browser — no app to install.",
                "On the first scan you can add your name and email so your stamps follow you to any device. Skip this if you'd rather stay anonymous (your card lives in a cookie on your phone instead).",
                "Order your coffee as usual. Tap 'Request stamp' — the barista approves it on their dashboard.",
                "When you hit the threshold (most cafes do 'buy 8, get 1 free'), the card lets you redeem at your next visit. Tap once, hand the barista your phone, free coffee.",
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

          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What to look for at the counter
            </h2>
            <ul className="mt-4 space-y-3 text-base leading-relaxed text-stone-600">
              <li>
                <strong className="text-stone-900">A QR code</strong> — usually
                small, square, often printed on a stand or stuck to the side
                of the till.
              </li>
              <li>
                <strong className="text-stone-900">Words like &ldquo;loyalty&rdquo;, &ldquo;stamp card&rdquo;, &ldquo;rewards&rdquo;</strong>
                {" "}— if you see those, it&rsquo;s a customer-facing program.
              </li>
              <li>
                <strong className="text-stone-900">A barista who knows the term</strong>
                {" "}— if you ask &ldquo;do you have a stamp card?&rdquo; and
                they pull out their phone or tablet to scan something, you&rsquo;re
                in.
              </li>
            </ul>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why cafes do this
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The maths is simple for cafe owners. A customer who&rsquo;s
              halfway through their stamp card visits ~30% more often than one
              who isn&rsquo;t collecting. The free drink at the end is cheap
              insurance against you walking past their shop to the next one on
              the block. So most independent cafes have either rolled out a
              digital loyalty card already, or are about to.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              You&rsquo;re not the product here — there&rsquo;s no ad
              targeting, no data sold on. The cafe just wants you to come back
              one more time. Win-win.
            </p>
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
              Run a cafe? Set up a free loyalty card in 2 minutes.
            </h3>
            <p className="mt-2 text-stone-500">
              Brewstamp is the free digital loyalty card for cafes — no
              contracts, no card-printing, no customer app.
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
