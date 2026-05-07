import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title:
    "Thirty 7even in Macquarie Park: 10 Weeks on Brewstamp",
  description:
    "How Asian-fusion cafe Thirty 7even in Macquarie Park, Sydney runs its digital coffee loyalty card on Brewstamp — 180+ regulars, 600+ stamps, and a fully branded card in the customer's pocket.",
  alternates: { canonical: "/blog/thirty-7even-macquarie-park" },
  openGraph: {
    type: "article",
    url: "/blog/thirty-7even-macquarie-park",
    title: "Thirty 7even in Macquarie Park: 10 Weeks on Brewstamp",
    description:
      "How Asian-fusion cafe Thirty 7even in Macquarie Park runs its digital coffee loyalty card on Brewstamp — 180+ regulars, 600+ stamps in 10 weeks.",
    images: [
      {
        url: "https://brewstamp.app/blog/thirty-7even-interior.jpg",
        width: 1200,
        height: 800,
        alt: "Thirty 7even cafe interior, Macquarie Park",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thirty 7even in Macquarie Park — Coffee Loyalty Story",
    description:
      "How Asian-fusion cafe Thirty 7even runs its digital coffee loyalty card on Brewstamp — 180+ regulars in 10 weeks.",
    images: [
      "https://brewstamp.app/blog/thirty-7even-interior.jpg",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Thirty 7even in Macquarie Park: 10 Weeks on Brewstamp",
  description:
    "Customer story — how Macquarie Park Asian-fusion cafe Thirty 7even runs its digital coffee loyalty card on Brewstamp.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/thirty-7even-macquarie-park",
  image: "https://brewstamp.app/blog/thirty-7even-interior.jpg",
  about: {
    "@type": "LocalBusiness",
    name: "Thirty 7even",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Macquarie Park",
      addressRegion: "NSW",
      addressCountry: "AU",
    },
  },
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
              Customer story
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Thirty 7even in Macquarie Park: 10 Weeks on Brewstamp
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              An Asian-fusion cafe on Sydney&rsquo;s North Shore launched a
              digital loyalty program on Brewstamp the day they signed up.
              Ten weeks later: nearly two hundred regulars enrolled and the
              first batch of free coffees has already gone over the counter.
            </p>
          </header>

          {/* Featured-snippet answer */}
          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              In short
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              Thirty 7even is a modern-Australian / Asian-fusion cafe in
              Macquarie Park, Sydney. They signed up to Brewstamp on 27
              February 2026 and configured their card on day one — logo,
              colours, pattern, all customised. Ten weeks in, they&rsquo;ve
              enrolled <strong>180+ regulars</strong>, awarded{" "}
              <strong>600+ stamps</strong>, and handed out their first{" "}
              <strong>~20 free coffees</strong> on the &ldquo;buy 10, get 1
              free&rdquo; threshold.
            </p>
          </div>

          {/* Hero image */}
          <figure className="mb-14">
            <img
              src="/blog/thirty-7even-interior.jpg"
              alt="Thirty 7even cafe interior in Macquarie Park, with a wave-pattern feature wall, warm wood panelling, dark navy banquettes and clean white tableware"
              className="w-full rounded-2xl"
              loading="eager"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              Inside Thirty 7even&rsquo;s Macquarie Park dining room. Photo
              via thirty7even.com.au.
            </figcaption>
          </figure>

          {/* Section 1 — The cafe */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The cafe
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Thirty 7even isn&rsquo;t a corner espresso bar — it&rsquo;s a
              full-service cafe doing modern-Australian food with Taiwanese
              and pan-Asian influences, on Sydney&rsquo;s North Shore. Coffee,
              matcha, specialty drinks, soft serve in the afternoon, focaccia,
              rice bowls. The kind of place where the morning regulars are
              office workers from Macquarie Park and the weekend crowd is
              brunch.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              That mix is interesting from a loyalty-program perspective. Most
              cafes either lean fully into &ldquo;coffee specialist&rdquo; or
              into &ldquo;eatery&rdquo; — Thirty 7even runs both, and the
              loyalty card needs to feel right for both audiences.
            </p>
          </section>

          {/* Section 2 — The setup */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Day-one setup
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The thing that stood out reviewing Thirty 7even&rsquo;s account
              is how thoroughly they configured Brewstamp on the first day.
              Logo uploaded. Brand colours dialled in. A custom card pattern
              applied. They didn&rsquo;t leave anything on default.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              That matters more than it sounds. The customer-facing loyalty
              card is the bit a regular sees fifty times before they ever
              redeem a free coffee. Most owners spin up the card and worry
              about branding later. Thirty 7even did it before their first
              real customer scanned. The result is a card that looks like it
              belongs to the cafe — not a generic Brewstamp template — from
              the very first scan.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              They also picked a <strong>10-stamp threshold</strong>. A
              little higher than the typical 7 or 8, but it suits a cafe
              where the average ticket includes a meal, not just a coffee —
              the reward is bigger because the journey is longer.
            </p>
          </section>

          {/* In-content image — coffee bar */}
          <figure className="mb-14">
            <img
              src="/blog/thirty-7even-bar.jpg"
              alt="Thirty 7even's espresso machine with stacks of takeaway cups and a wall of bottled drinks behind"
              className="w-full rounded-2xl"
              loading="lazy"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              The espresso bar — where the QR code lives. Photo via
              thirty7even.com.au.
            </figcaption>
          </figure>

          {/* Section 3 — The numbers */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The numbers, ten weeks in
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Thirty 7even joined Brewstamp on 27 February 2026 and went
              straight onto the Pro plan ($5/month, unlimited stamps). The
              snapshot from their merchant dashboard:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  stat: "180+",
                  label: "Customers enrolled",
                  desc: "Regulars who&rsquo;ve scanned the QR code at least once.",
                },
                {
                  stat: "600+",
                  label: "Stamps awarded",
                  desc: "Approved stamps on real customer cards — about 9 a day on average.",
                },
                {
                  stat: "~20",
                  label: "Free coffees redeemed",
                  desc: "Customers who&rsquo;ve already hit ten stamps and walked out with the reward.",
                },
              ].map(({ stat, label, desc }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-stone-200 bg-white p-5 text-center"
                >
                  <p className="text-3xl font-bold text-amber-700">{stat}</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {label}
                  </p>
                  <p
                    className="mt-2 text-xs leading-relaxed text-stone-500"
                    dangerouslySetInnerHTML={{ __html: desc }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              For a 10-week-old loyalty program, that&rsquo;s a healthy curve.
              The first reward redemptions are the moment a loyalty program
              starts to <em>feel</em> real to a customer. Once they&rsquo;ve
              had one free coffee, the card stops being a side note and
              becomes a habit.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The other detail worth flagging: every weekly drip email we
              send — Day 1, Day 3, Day 7, Day 14 — has fired and been
              acknowledged. The owner is engaged, the program is being
              actively used, and the dashboard gets opened. That combination
              is what makes a loyalty program go from &ldquo;set it up&rdquo;
              to &ldquo;quietly working in the background.&rdquo;
            </p>
          </section>

          {/* Section 4 — Why digital */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why a digital card fits this kind of cafe
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Macquarie Park is a tech-and-business district. A lot of
              Thirty 7even&rsquo;s morning regulars are walking in from
              office buildings with their phones, an access pass, and not
              much else. A paper punch card never had a chance — there&rsquo;s
              nowhere to put it.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              A digital loyalty card meets those customers where they
              actually are. Scan the QR at the counter once, and the
              card&rsquo;s on their phone forever. They can save it to their
              home screen if they want, or just bookmark it. Nothing to
              forget.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              On the cafe&rsquo;s side, the merchant dashboard surfaces who
              their actual regulars are — names, visit frequency, how close
              each customer is to their next free coffee. Useful information
              that paper cards have never been able to give an owner, no
              matter how diligent the staff are with the rubber stamp.
            </p>
          </section>

          {/* CTA */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Run a cafe? Set up the same thing in 2 minutes.
            </h3>
            <p className="mt-2 text-stone-500">
              Free up to 100 stamps. No app for your customers. Print one QR
              code and you&rsquo;re live.
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
