import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title:
    "Bennett St Dairy in Bondi: How a Real Cafe Runs Its Coffee Loyalty Card",
  description:
    "How Bondi cafe Bennett St Dairy runs a digital coffee loyalty card with the team behind Brewstamp — QR code at the counter, buy 7 get 1 free, 863 customers and nearly 5,000 stamps in seven months.",
  alternates: { canonical: "/blog/bennett-st-dairy-bondi" },
  openGraph: {
    type: "article",
    url: "/blog/bennett-st-dairy-bondi",
    title: "Bennett St Dairy in Bondi: How a Real Cafe Runs Its Loyalty Card",
    description:
      "How Bondi cafe Bennett St Dairy runs a digital coffee loyalty card — QR code at the counter, buy 7 get 1 free, 863 customers and nearly 5,000 stamps in seven months.",
    images: [
      {
        url: "https://images.pexels.com/photos/16323069/pexels-photo-16323069.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Bondi Beach, Sydney — home of Bennett St Dairy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bennett St Dairy in Bondi — Coffee Loyalty Card Story",
    description:
      "How Bondi cafe Bennett St Dairy runs a digital coffee loyalty card.",
    images: [
      "https://images.pexels.com/photos/16323069/pexels-photo-16323069.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Bennett St Dairy in Bondi: How a Real Cafe Runs Its Coffee Loyalty Card",
  description:
    "Customer story — how Bondi cafe Bennett St Dairy runs a digital coffee loyalty card.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/bennett-st-dairy-bondi",
  datePublished: "2026-05-06",
  dateModified: "2026-05-06",
  image:
    "https://images.pexels.com/photos/16323069/pexels-photo-16323069.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630",
  about: {
    "@type": "LocalBusiness",
    name: "Bennett St Dairy",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bondi Beach",
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
              Bennett St Dairy in Bondi: How a Real Cafe Runs Its Coffee
              Loyalty Card
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              A small QR code on a wooden counter, a single line of copy
              underneath — &ldquo;Buy 7 coffees, get 1 free&rdquo; — and dozens
              of Bondi regulars on a digital loyalty card. Here&rsquo;s what
              it actually looks like in the wild.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-05-06">6 May 2026</time>
            </p>
          </header>

          {/* Featured-snippet answer */}
          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              In short
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              Bennett St Dairy is a coffee shop in Bondi Beach, Sydney
              that&rsquo;s been running a digital coffee loyalty card with
              our team since October 2025 — on StampyStamp, the platform
              we built before Brewstamp. Customers scan a QR code at the
              counter, collect stamps on their phone, and earn a free coffee
              after seven paid ones. No app to download, nothing to carry.
              In seven months they&rsquo;ve enrolled <strong>863
              customers</strong>, awarded <strong>4,940 stamps</strong>, and
              handed out <strong>602 free coffees</strong>.
            </p>
          </div>

          {/* Hero image */}
          <figure className="mb-14">
            <img
              src="https://images.pexels.com/photos/16323069/pexels-photo-16323069.jpeg?auto=compress&cs=tinysrgb&w=940&h=600&fit=crop"
              alt="Bondi Beach in Sydney, Australia — home of Bennett St Dairy"
              className="w-full rounded-2xl"
              loading="eager"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              Bondi Beach, where Bennett St Dairy serves its coffee. Photo by
              Wingspan Artist on Pexels.
            </figcaption>
          </figure>

          {/* Section 1 — The cafe */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The cafe
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Bennett St Dairy sits a couple of blocks back from the sand in
              Bondi Beach. It&rsquo;s the kind of cafe that does a steady
              morning trade in flat whites and croissants — pastries lined up
              in baskets behind the glass, a row of cookies, soft serve in the
              afternoon, the usual cast of regulars who walk in without
              ordering because the barista already knows.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              That last detail is the whole game for a cafe loyalty program.
              The regulars are the business. The question is just: how do you
              reward them in a way that keeps them coming back without
              adding friction to the morning rush?
            </p>
          </section>

          {/* Section 2 — The setup */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The setup
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Bennett St Dairy&rsquo;s entire loyalty system is one printed
              QR code, taped to the front of the counter at roughly phone
              height. Underneath, a single line:
            </p>
            <blockquote className="mt-6 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-6 py-4 text-base italic text-stone-700">
              Passless reward card — buy 7 coffees, get 1 free.
            </blockquote>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              That&rsquo;s the whole onboarding flow. Customers scan with
              their phone camera, the loyalty card opens in their browser,
              and they&rsquo;re in the program before their order is poured.
              No app to download. No email or password to set. No physical
              card to misplace by Wednesday.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Behind the counter, the staff have our merchant dashboard open
              on a phone next to the EFTPOS iPad. When a customer scans, a
              stamp request pops up — a quick tap to approve and the stamp
              lands on their card in real time.
            </p>
          </section>

          {/* In-content image — the counter shot */}
          <figure className="mb-14">
            <img
              src="/blog/bennett-st-dairy-counter.jpg"
              alt="Bennett St Dairy's counter in Bondi, with the loyalty card QR code displayed at customer eye level beneath the EFTPOS terminal"
              className="mx-auto w-full max-w-md rounded-2xl"
              loading="lazy"
            />
            <figcaption className="mt-2 text-center text-xs text-stone-400">
              The QR code lives on the front of Bennett St Dairy&rsquo;s
              counter, right where customers&rsquo; phones already are.
            </figcaption>
          </figure>

          {/* Section 3 — The reward */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why &ldquo;buy 7, get 1 free&rdquo; works
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Seven is a slightly unusual threshold — most cafes default to
              eight or ten. Bennett St Dairy went with seven on purpose: low
              enough that a daily regular hits the reward inside two weeks,
              high enough to protect the margin on the free drink. The
              shorter the window between joining and the first reward, the
              more customers feel it&rsquo;s worth scanning in the first
              place.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The reward itself is a free coffee — not a discount, not a
              percentage off, not a points balance to track. People respond to
              free things. &ldquo;Get 15% off your tenth coffee&rdquo; sounds
              generous on paper and consistently underperforms in practice.
            </p>
          </section>

          {/* Section 4 — The numbers */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The numbers
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Bennett St Dairy joined our platform on 7 October 2025. Pulled
              fresh from the database, the lifetime view as of May 2026:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  stat: "863",
                  label: "Customers enrolled",
                  desc: "Distinct customers who&rsquo;ve scanned the QR code at least once.",
                },
                {
                  stat: "4,940",
                  label: "Stamps awarded",
                  desc: "Approved stamp requests — each one a paid coffee.",
                },
                {
                  stat: "602",
                  label: "Free coffees redeemed",
                  desc: "Reward redemptions handed out at the counter — happy regulars walking away.",
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
              The recent trend is steady too —{" "}
              <strong className="text-stone-800">121 active customers</strong>{" "}
              and <strong className="text-stone-800">416 stamps</strong> in
              the last 30 days, with{" "}
              <strong className="text-stone-800">62 free coffees</strong>{" "}
              redeemed in the same window.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              That redemption number is the most underrated metric in any
              cafe loyalty program. Six hundred free coffees handed over the
              counter is six hundred small moments of customer delight — the
              one paper cards keep promising and quietly fail to deliver.
            </p>
          </section>

          {/* In-content image — actual dashboard photo */}
          <figure className="mb-14">
            <img
              src="/blog/bennett-st-dairy-dashboard.jpg"
              alt="Bennett St Dairy's POS iPad next to a phone showing the merchant loyalty dashboard"
              className="w-full rounded-2xl"
              loading="lazy"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              The POS and the merchant dashboard, side by side at Bennett
              St Dairy&rsquo;s counter.
            </figcaption>
          </figure>

          {/* Section 5 — Why it works */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why digital was the right call
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The thing about Bondi specifically — and any beachside or
              tourist-heavy area — is that &ldquo;wallet&rdquo; is a loose
              concept. Customers walk in with phones, sunglasses, and
              maybe a tap-to-pay watch. Asking them to keep track of a
              cardboard punch card is asking them to do something they have
              already collectively decided they will not do.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              A digital loyalty card meets people where they already are: in
              their phone&rsquo;s browser. The card lives in a tab they can
              bookmark or save to their home screen. There&rsquo;s no install,
              no account, no friction. Even a tourist passing through for
              a week can collect a stamp or two and still feel rewarded.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              On the cafe&rsquo;s side, the dashboard does what paper never
              could — surface who the actual regulars are, when they&rsquo;ve
              gone quiet, and how often the loyalty program is being used.
              That&rsquo;s the kind of data that lets a small cafe make
              decisions like a chain without becoming one.
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
