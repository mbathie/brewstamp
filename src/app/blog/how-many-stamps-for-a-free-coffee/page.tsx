import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title:
    "How Many Stamps for a Free Coffee? Loyalty Card Thresholds Explained",
  description:
    "Most cafes set their loyalty card between 6 and 10 stamps for a free coffee. Here's why the number matters, what the typical reward looks like, and what to watch out for.",
  alternates: { canonical: "/blog/how-many-stamps-for-a-free-coffee" },
  openGraph: {
    type: "article",
    url: "/blog/how-many-stamps-for-a-free-coffee",
    title: "How Many Stamps for a Free Coffee? Loyalty Card Thresholds Explained",
    description:
      "Most cafes set their loyalty card between 6 and 10 stamps. Here's why the number matters and what to expect.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=1200&h=630&q=70&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Row of paper takeaway coffee cups — the journey to a free one",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Many Stamps for a Free Coffee?",
    description:
      "Most cafes set their loyalty card between 6 and 10 stamps. Here's why and what to expect.",
    images: [
      "https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=1200&h=630&q=70&auto=format&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "How Many Stamps for a Free Coffee? Loyalty Card Thresholds Explained",
  description:
    "Most cafes set their loyalty card between 6 and 10 stamps. Here's why the number matters and what to watch out for.",
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
    "https://brewstamp.app/blog/how-many-stamps-for-a-free-coffee",
  datePublished: "2026-05-13",
  dateModified: "2026-05-13",
  image:
    "https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=940&h=650&q=70&auto=format&fit=crop",
};

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How many stamps does a typical coffee loyalty card need for a free drink?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most cafes set their loyalty card between 6 and 10 stamps for a free coffee. 8 is the most common starting point — attainable for a regular customer in two to three weeks, but not so low that it eats too far into the cafe's margin.",
      },
    },
    {
      "@type": "Question",
      name: "Do I get a free drink of any size, or just the cheapest one?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It varies. Most cafes let you redeem any standard hot drink (latte, flat white, cappuccino, long black). Some restrict it to a regular size, exclude specialty drinks, or apply the value as a discount. The cafe usually states the exact rule on the card itself when you scan.",
      },
    },
    {
      "@type": "Question",
      name: "Does it count as a stamp if I buy two coffees at once?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "With a digital loyalty card, the barista can usually award more than one stamp at a time. Just ask — they'll either tap +2 on their dashboard, or you scan the QR code twice. Paper cards almost always limit you to one stamp per visit regardless of how much you buy.",
      },
    },
    {
      "@type": "Question",
      name: "Do coffee loyalty stamps expire?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paper stamp cards effectively expire whenever you lose them (which is often). Digital loyalty cards don't expire automatically — your stamps stay on the card until you redeem them, as long as the cafe is still using the same platform. Some larger chains apply 12-month expiries, but independent cafes usually don't.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to my stamps if I lose my phone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Depends on the platform. If you added your name and email when you signed up, the cafe (or you) can pull your stamps back up on a new device. If you stayed fully anonymous, your stamps are tied to a cookie on the original phone and you'd lose them. Always add at least an email on the first scan — takes 5 seconds.",
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
              How many stamps for a free coffee?
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Short answer: <strong className="text-stone-700">6 to 10</strong>,
              with 8 being the most common. Here&rsquo;s why cafes land on that
              number, what counts as &ldquo;free&rdquo;, and how digital and
              paper loyalty cards differ on the things that matter.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-05-13">13 May 2026</time>
            </p>
          </header>

          {/* Quick-answer card so the SERP snippet has something dense to grab */}
          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The short version
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              Most cafe loyalty cards need <strong>8 stamps for a free
              coffee</strong>. The range is 6 (small independents who want fast
              wins) to 10 (chains with thinner margins). The reward is usually
              a standard hot drink of your choice, redeemed on your next
              visit. Digital cards let you stack multiple stamps in one visit;
              paper cards almost never do.
            </p>
          </div>

          <figure className="mb-14 rounded-2xl bg-stone-100 px-6 py-8">
            <img
              src="https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=940&h=600&q=70&auto=format&fit=crop"
              alt="Cappuccino served on a wooden tray with a loyalty card"
              className="mx-auto w-full max-w-2xl rounded-xl"
              loading="lazy"
            />
            <figcaption className="mt-4 text-center text-xs text-stone-400">
              Eight cappuccinos in two weeks, then the ninth is on the house.
            </figcaption>
          </figure>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why 8 is the most common threshold
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              When a cafe sets their loyalty threshold, they&rsquo;re balancing
              two things: <strong>how motivated you feel to come back</strong>{" "}
              and <strong>how much margin they give up to your reward</strong>.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              At 6 stamps, a free coffee comes around fast. Customers feel the
              reward is real, but the cafe is effectively giving away ~14% of
              their revenue from regulars. At 10 stamps, that drops to 9% —
              but a lot of customers lose interest before they hit the
              threshold.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              <strong>8 lands in the sweet spot.</strong> A 5-day-a-week
              regular hits it in just under two weeks, and the cafe&rsquo;s
              giving up roughly 11% of revenue from those customers — a
              healthy price to pay for someone who comes back every weekday.
            </p>
          </section>

          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What the reward usually looks like
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The default is <strong>any standard hot drink of your
              choice</strong> — latte, flat white, cappuccino, long black.
              Some cafes restrict to a regular size; specialty drinks like
              matcha lattes or single-origin pour-overs sometimes need a
              top-up.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  bold: "Most common:",
                  text: "Free standard hot drink, any milk, regular size. No top-up for the obvious stuff (oat, almond, syrup) but specialty extras may cost.",
                },
                {
                  bold: "Generous:",
                  text: "Any drink, any size, no exclusions. You see this at independent cafes that want to lean hard into loyalty.",
                },
                {
                  bold: "Restricted:",
                  text: "Cheapest drink only, or a fixed dollar value off your next purchase. More common at chains with tighter margins.",
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
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              When in doubt, the rule is usually written on the card itself
              when you scan it for the first time.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Digital vs paper: what actually changes
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The threshold (6–10 stamps) is the same on both. What&rsquo;s
              different is the friction around earning and redeeming.
            </p>
            <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <div className="grid grid-cols-3 gap-px bg-stone-200">
                <div className="bg-white p-4 text-sm font-semibold text-stone-900">
                  &nbsp;
                </div>
                <div className="bg-white p-4 text-center text-sm font-semibold text-stone-900">
                  Paper card
                </div>
                <div className="bg-white p-4 text-center text-sm font-semibold text-stone-900">
                  Digital card
                </div>
                {[
                  ["Stamps if you lose it", "Gone", "Reattach to phone via email"],
                  ["Multiple stamps in one visit", "Almost never", "Yes — barista taps +2"],
                  ["Need an app?", "No", "No (most are browser-based)"],
                  ["Switching phones", "Doesn't apply", "Stamps follow your email"],
                  ["Expiry", "Whenever you lose it", "Usually none"],
                ].map(([label, paper, digital]) => (
                  <Fragment key={label}>
                    <div className="bg-white p-4 text-sm text-stone-700">
                      {label}
                    </div>
                    <div className="bg-white p-4 text-center text-sm text-stone-600">
                      {paper}
                    </div>
                    <div className="bg-white p-4 text-center text-sm text-stone-600">
                      {digital}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How to actually earn yours
            </h2>
            <ol className="mt-6 space-y-4">
              {[
                "When you order, look for a QR code at the counter (or just ask if they have a loyalty card). Most cafes do — they're just bad at signage.",
                "Scan with your phone camera. The card opens in your browser — no app to download.",
                "Add at least your name + email on the first scan. Takes 5 seconds. Without it, your stamps live in a cookie on your phone and disappear if you switch devices.",
                "Tap 'Request stamp'. The barista approves it on their end. The stamp lands instantly.",
                "Hit your threshold (8 is the default), tap to redeem next time you order. Hand the barista your phone, free coffee, done.",
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

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Common questions
            </h2>
            <div className="mt-6 space-y-6">
              {[
                {
                  q: "What if the cafe&rsquo;s loyalty card needs more than 10 stamps?",
                  a: "Anything above 10 is a stretch. If a cafe sets the bar at 15 or 20, most customers lose interest before they hit it. If you spot one, decide whether the cafe is worth the haul — or if you'd rather take your business to one with a more attainable program.",
                },
                {
                  q: "Can the barista add more than one stamp if I order two coffees?",
                  a: "On a digital loyalty card, yes — they tap +2 on their dashboard. On a paper card, they almost never will. The whole loyalty model assumes one stamp per visit; doubling up undermines it.",
                },
                {
                  q: "Can I have one loyalty card across multiple cafes?",
                  a: "No — each cafe runs their own. Your stamps at one cafe don't transfer to another. Some digital loyalty platforms let one customer profile span multiple cafes (each with their own separate card), so you don't have to re-add your details every time.",
                },
                {
                  q: "Do unused stamps eventually expire?",
                  a: "Digital cards usually don't expire. Some larger chains apply a 12-month rolling expiry on unused stamps; independent cafes rarely do. Paper cards effectively expire whenever you lose the card.",
                },
              ].map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-stone-200 bg-white px-6 py-5"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-stone-900">
                    <span dangerouslySetInnerHTML={{ __html: q }} />
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

          {/* Internal links — keep the customer-side audience reading */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Keep reading
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/blog/cafe-loyalty-programs-for-customers"
                className="block rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-amber-300 hover:bg-amber-50"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  For customers
                </p>
                <p className="mt-2 text-base font-semibold text-stone-900">
                  Does this cafe have a loyalty program?
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  How to spot one at the counter and start earning.
                </p>
              </Link>
              <Link
                href="/blog/qr-code-loyalty-program"
                className="block rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-amber-300 hover:bg-amber-50"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  How-to
                </p>
                <p className="mt-2 text-base font-semibold text-stone-900">
                  How QR code loyalty programs work
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Behind the scenes — what happens when you scan.
                </p>
              </Link>
            </div>
          </section>

          {/* Soft CTA — this audience is customers, not cafe owners */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Run a cafe? Set up a free loyalty card in 2 minutes.
            </h3>
            <p className="mt-2 text-stone-500">
              No app for your customers. Free up to 100 stamps. Print the QR
              code, stick it at the counter, you&rsquo;re live.
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
