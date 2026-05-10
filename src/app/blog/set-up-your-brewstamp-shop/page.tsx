import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "How to Set Up Your Brewstamp Shop in 5 Minutes",
  description:
    "Step-by-step guide to setting up Brewstamp at your cafe. Print the QR code, run a test stamp, and award your first real one — all in under 5 minutes.",
  alternates: { canonical: "/blog/set-up-your-brewstamp-shop" },
  openGraph: {
    type: "article",
    url: "/blog/set-up-your-brewstamp-shop",
    title: "How to Set Up Your Brewstamp Shop in 5 Minutes",
    description:
      "Step-by-step setup walkthrough for new Brewstamp shops. Print, test, stamp.",
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
    title: "How to Set Up Your Brewstamp Shop in 5 Minutes",
    description:
      "Step-by-step setup walkthrough for new Brewstamp shops.",
    images: [
      "https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Set Up Your Brewstamp Shop in 5 Minutes",
  description:
    "Step-by-step setup walkthrough for new Brewstamp shops — print the QR code, run a test stamp, award your first real one.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Download and print your QR code",
      text: "From your dashboard, go to Settings and download the printable QR code PDF. Print it and place it where customers will see it at the counter.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Stay logged in at the point of sale",
      text: "Keep your Brewstamp dashboard open on a tablet, laptop, or phone at the counter so stamp requests appear in real-time.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Run a test stamp yourself",
      text: "Before your first real customer, scan the QR code with your own phone, complete the customer flow, and approve the stamp from your dashboard.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Award your first real stamp",
      text: "When a customer scans, a request appears on your dashboard. Tap approve and the stamp lands on their card.",
    },
  ],
  datePublished: "2026-05-10",
  dateModified: "2026-05-10",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
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
              How-to
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              How to set up your Brewstamp shop in 5 minutes
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              You&apos;ve created your shop, now what? This is the practical,
              click-by-click walkthrough to get from sign-up to your first
              real customer stamp without guessing what to do next.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-05-10">10 May 2026</time>
            </p>
          </header>

          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The whole flow in one paragraph
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              Print the QR code, stick it at the counter, keep your dashboard
              open on a device near the till, scan the code yourself once to
              see what a request looks like, then approve real customers as
              they scan. That&apos;s the entire job. The five minutes below
              walks through it cleanly.
            </p>
          </div>

          <figure className="mb-14">
            <img
              src="https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Customer scanning a QR code at a cafe counter"
              className="w-full rounded-2xl"
              loading="eager"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              A customer scans the QR code at the counter — no app required.
            </figcaption>
          </figure>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              1. Download and print your QR code
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Open{" "}
              <a
                href="https://brewstamp.app/dashboard/settings"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                Settings
              </a>{" "}
              from the sidebar. Hit <em>Download QR code</em> &mdash; you get
              a printable PDF with your shop&apos;s unique code on it. Print
              it on regular paper. Stick it on the counter, the menu, the
              register &mdash; somewhere a customer can&apos;t miss while
              they&apos;re waiting for their drink.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              <strong className="text-stone-800">Pro tip:</strong> the spot
              matters more than the size. Right next to the EFTPOS machine
              (where the customer is already looking down at the counter) gets
              the highest scan rate.
            </p>
          </section>

          <figure className="mb-14">
            <img
              src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-cafe-qr.jpg"
              alt="Brewstamp QR code printed and placed on a cafe counter"
              className="w-full rounded-2xl"
              loading="lazy"
            />
            <figcaption className="mt-2 text-xs text-stone-400">
              Print the QR code and place it where customers will see it at the counter.
            </figcaption>
          </figure>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              2. Keep your dashboard open at the counter
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Brewstamp is real-time &mdash; when a customer scans, a stamp
              request pops up on{" "}
              <a
                href="https://brewstamp.app/dashboard"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                your dashboard
              </a>{" "}
              instantly. So your dashboard needs to be open somewhere you can
              see it. A tablet at the till is ideal; a phone in your apron
              works too.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Each request is live for 10 minutes. If you&apos;re mid-coffee
              and one comes in, finish the drink and tap{" "}
              <em>Approve</em> &mdash; you have plenty of time.
            </p>
          </section>

          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              3. Run a test stamp on yourself
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              This is the step most cafes skip and then regret. Before your
              first real customer scans, run the flow once yourself so
              you&apos;ve seen what an approval looks like:
            </p>
            <ol className="mt-6 space-y-4">
              {[
                "Open your QR code on the printed sheet (or pull it up on your dashboard's Settings screen).",
                "Point your phone's camera at it. Tap the link that appears.",
                "Complete the customer flow on your phone — name, hit the big stamp button.",
                "Switch back to your dashboard. Within a second or two, a stamp request will appear. Tap Approve.",
                "On your phone, watch the stamp land on the card.",
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
              Now you know exactly what a real customer scan looks like. When
              the next request rolls in, you&apos;ll approve it without
              hesitating.
            </p>
          </section>

          <figure className="mb-14">
            <img
              src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-loyalty-card.png"
              alt="A Brewstamp loyalty card on a customer's phone"
              className="mx-auto w-full max-w-md rounded-2xl shadow-lg"
              loading="lazy"
            />
            <figcaption className="mt-2 text-center text-xs text-stone-400">
              What lands on your customer&apos;s phone after you tap Approve.
            </figcaption>
          </figure>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              4. Award your first real stamp
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              When a real customer scans the QR code at the counter, a request
              appears on your dashboard exactly the same way the test one
              did. Tap <em>Approve</em>. The stamp lands on their card
              instantly. Done.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              If a customer tries to scan a second time for the same drink (it
              happens &mdash; a friend wants in too, kids playing with the
              code), just tap <em>Reject</em>. Nothing breaks; the request
              quietly disappears.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              5. What to do next
            </h2>
            <ul className="mt-4 space-y-4">
              {[
                {
                  bold: "Tell your regulars.",
                  text: "Mention the loyalty card to your existing customers as they pay. One sentence: \"We've got a loyalty card now — scan that QR code, after 8 coffees the next one's free, no app needed.\"",
                },
                {
                  bold: "Customise the card.",
                  text: "From Settings you can change the card's colours, upload a logo, and set the stamp threshold (6, 8, 10 — whatever fits your margin).",
                },
                {
                  bold: "Watch the Customers tab.",
                  text: "After a couple of weeks you'll see who your most loyal regulars are. The data was never visible with paper cards.",
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

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Stuck on anything?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The two most common stuck points: not knowing the QR code is
              printed too small (re-print at A4 if scans are failing), and
              not having the dashboard open at the till (the request goes
              somewhere, but you don&apos;t see it). Both are easy fixes.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Anything else, email{" "}
              <a
                href="mailto:hello@brewstamp.app"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                hello@brewstamp.app
              </a>{" "}
              and Mark will reply directly.
            </p>
          </section>

          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Ready to set up your shop?
            </h3>
            <p className="mt-2 text-stone-500">
              Free up to 100 stamps. No credit card. Live in 2 minutes.
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
