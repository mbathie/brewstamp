import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "How to Set Up a QR Code Loyalty Program for Your Coffee Shop",
  description:
    "Step-by-step guide to launching a QR code loyalty program at your cafe. No app needed, free to start, works on any phone.",
  openGraph: {
    title: "How to Set Up a QR Code Loyalty Program for Your Coffee Shop",
    description:
      "Step-by-step guide to launching a QR code loyalty program at your cafe. No app needed, free to start, works on any phone.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Set Up a QR Code Loyalty Program for Your Coffee Shop",
  description:
    "Step-by-step guide to launching a QR code loyalty program at your cafe. No app needed, free to start, works on any phone.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: { "@type": "ImageObject", url: "https://brewstamp.app/apple-touch-icon.png" },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/qr-code-loyalty-program",
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
              How-to
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              How to Set Up a QR Code Loyalty Program for Your Coffee Shop
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              A QR code at the counter is the simplest way to run a loyalty
              program. Here&apos;s exactly how to set one up — from choosing a
              platform to getting your first regulars enrolled.
            </p>
          </header>

          {/* Section 1 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why QR codes work for cafe loyalty
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              QR codes became second nature during COVID. Your customers already
              know how to point their phone camera at a code. That familiarity
              is a massive advantage — there&apos;s zero learning curve.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Compared to app-based loyalty programs, QR codes have one critical
              advantage: <strong className="text-stone-800">no download required</strong>.
              The moment a customer scans your code, they&apos;re in the
              program. No App Store, no sign-up form, no password.
            </p>
          </section>

          {/* Image break */}
          <img
            src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-cafe-qr.jpg"
            alt="QR code printed out on a cafe counter"
            className="mb-14 w-full rounded-2xl"
          />

          {/* Step 1 */}
          <section className="mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
              Choose your platform
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              You need a platform that generates a QR code, tracks stamps, and
              shows customers their loyalty card. Here&apos;s what to evaluate:
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  bold: "Does it require an app download?",
                  text: "If yes, skip it. Most customers won't download an app for a coffee loyalty card.",
                },
                {
                  bold: "How does stamping work?",
                  text: "You want real-time approval — the customer scans, you approve, the stamp appears. Avoid platforms where the stamp happens automatically (easy to abuse).",
                },
                {
                  bold: "What's the pricing?",
                  text: "Free or cheap to start. You're testing this, not committing to a yearly contract.",
                },
                {
                  bold: "How long does setup take?",
                  text: "If it takes more than 10 minutes, it's overengineered for a cafe.",
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

          {/* Step 2 */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Step 2
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
              Create your shop and set your reward
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Once you pick a platform, the first decision is your stamp
              threshold — how many stamps before a free drink?
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              <strong className="text-stone-800">Our recommendation: start with 8.</strong>{" "}
              It&apos;s attainable enough that customers feel motivated, but not
              so low that it eats into your margins. You can always adjust later.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Set your reward to something simple and clear: &quot;Free coffee
              of your choice&quot; works better than &quot;10% off your next
              order.&quot; People respond to free things, not discounts.
            </p>
          </section>

          {/* Step 3 */}
          <section className="mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Step 3
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
              Print and place your QR code
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Placement matters more than you think. Best spots:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "At the register",
                  text: "Where the transaction happens. A small tent card or sticker next to the EFTPOS machine.",
                },
                {
                  title: "The waiting spot",
                  text: "Customers are already standing there with their phone out. Make it easy.",
                },
                {
                  title: "Table talkers",
                  text: "If you do table service, let customers scan while they wait for their order.",
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
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              Avoid putting the QR code only on the menu or only on the wall.
              It should be within arm&apos;s reach during the moment of purchase.
            </p>
          </section>

          {/* Step 4 */}
          <section className="mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Step 4
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
              Tell your staff
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Your baristas are the program&apos;s marketing team. Give them a
              simple script:
            </p>
            <blockquote className="mt-6 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-6 py-4 text-base italic text-stone-700">
              &quot;We&apos;ve got a digital stamp card — scan the QR code and
              after 8 coffees your next one&apos;s free. No app needed.&quot;
            </blockquote>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              That&apos;s it. No hard sell needed. Most customers will scan it
              right away — especially if they see the QR code already sitting on
              the counter.
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

          {/* Step 5 */}
          <section className="mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Step 5
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
              Launch and track
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              For the first week, pay attention to:
            </p>
            <ul className="mt-6 space-y-4">
              {[
                "How many people are scanning? If the number is low, try repositioning the QR code or having staff mention it more.",
                "Are people coming back? After a few days, you should see repeat scans from the same customers.",
                "Is it slowing down service? It shouldn't — the scan takes seconds. If it is, check that your approval process is streamlined.",
              ].map((text, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-base leading-relaxed text-stone-600"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Mistakes */}
          <section className="mb-14 rounded-2xl bg-red-50 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Common mistakes to avoid
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                {
                  bold: "Setting the threshold too high.",
                  text: "15 stamps feels unattainable. 6–10 is the sweet spot.",
                },
                {
                  bold: "Not telling customers about it.",
                  text: "A QR code on the counter without context gets ignored. Staff need to mention it for the first few weeks.",
                },
                {
                  bold: "Overcomplicating the reward.",
                  text: '"Free regular coffee" is better than a tiered points system. Keep it dead simple.',
                },
              ].map(({ bold, text }) => (
                <li
                  key={bold}
                  className="flex gap-3 text-base leading-relaxed text-stone-600"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  <span>
                    <strong className="text-stone-800">{bold}</strong> {text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Set up your QR code loyalty program in 2 minutes
            </h3>
            <p className="mt-2 text-stone-500">
              Free to start. No app download for your customers.
            </p>
            <div className="mt-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-600 px-8 text-base hover:bg-amber-700"
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
