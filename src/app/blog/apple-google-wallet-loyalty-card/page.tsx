import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import RelatedGuides from "@/components/related-guides";

export const metadata: Metadata = {
  title: "Add Your Coffee Loyalty Card to Apple Wallet & Google Wallet",
  description:
    "Brewstamp loyalty cards now save to Apple Wallet and Google Wallet — lock-screen access, no app to download, and stamps that update automatically. Available on every plan, including Free.",
  alternates: { canonical: "/blog/apple-google-wallet-loyalty-card" },
  openGraph: {
    type: "article",
    url: "/blog/apple-google-wallet-loyalty-card",
    title: "Add Your Coffee Loyalty Card to Apple Wallet & Google Wallet",
    description:
      "Brewstamp loyalty cards now save to Apple Wallet and Google Wallet — lock-screen access, no app to download, and stamps that update automatically.",
    images: [
      {
        url: "https://images.pexels.com/photos/887751/pexels-photo-887751.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Person holding a smartphone at a cafe counter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Add Your Coffee Loyalty Card to Apple Wallet & Google Wallet",
    description:
      "Brewstamp loyalty cards now save to Apple Wallet and Google Wallet — lock-screen access, no app to download.",
    images: [
      "https://images.pexels.com/photos/887751/pexels-photo-887751.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Add Your Coffee Loyalty Card to Apple Wallet & Google Wallet",
  description:
    "Brewstamp loyalty cards now save to Apple Wallet and Google Wallet — lock-screen access, no app to download, and stamps that update automatically.",
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
    "https://brewstamp.app/blog/apple-google-wallet-loyalty-card",
  datePublished: "2026-06-22",
  dateModified: "2026-06-22",
  image:
    "https://images.pexels.com/photos/887751/pexels-photo-887751.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
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
              Product update
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Your loyalty card, now in Apple Wallet &amp; Google Wallet
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Customers can save their Brewstamp card straight to Apple Wallet
              or Google Wallet — right next to their boarding passes and
              concert tickets. It updates itself every time they earn a stamp,
              and there&apos;s still nothing to download.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-06-22">22 June 2026</time>
            </p>
          </header>

          <figure className="mb-12 overflow-hidden rounded-2xl border border-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/blog/wallet-passes-hero.svg"
              alt="A Brewstamp loyalty card with Add to Apple Wallet and Add to Google Wallet buttons"
              className="w-full"
            />
          </figure>

          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The short version
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              When a customer opens their card, they now see an{" "}
              <strong>Add to Apple Wallet</strong> or{" "}
              <strong>Add to Google Wallet</strong> button matching their phone.
              One tap and the card lives in their wallet — fully branded with
              your logo and colours. It&apos;s available on{" "}
              <strong>every plan, including Free</strong>. Just flip the wallet
              toggle in Shop Setup.
            </p>
          </div>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why put a loyalty card in the wallet?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The browser card has always been the heart of Brewstamp — scan
              the QR code, the card opens, no app store, no account. That works
              beautifully at the counter. But between visits, a bookmark or a
              browser tab is easy to lose. The wallet fixes that.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Once the card is in Apple Wallet or Google Wallet, it&apos;s one
              swipe from the lock screen. No hunting through browser history.
              And because the pass is tied to your customer&apos;s real wallet,
              it&apos;s exactly where they already look when they pay for coffee.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-stone-100 px-6 py-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/badges/add-to-apple-wallet.svg"
                alt="Add to Apple Wallet"
                className="h-12 w-auto"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/badges/add-to-google-wallet.svg"
                alt="Add to Google Wallet"
                className="h-12 w-auto"
              />
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Stamps that update on their own
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              This is the part that makes a wallet pass worth having. When you
              approve a stamp at the counter, the customer&apos;s wallet pass
              updates automatically — the new stamp count shows up without them
              re-opening anything. Earn your free coffee and the reward state
              changes too.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              It&apos;s the same live data as the browser card, just surfaced in
              two more places. A customer can use the QR card at the counter and
              still glance at their wallet pass on the train home — both stay in
              sync.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Does this change how stamping works?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              No — the counter flow is identical. The customer still scans your
              QR code (or opens their wallet pass, which carries the same code),
              requests a stamp, and you approve it on your device in real time.
              The wallet pass is an extra home for the card, not a different
              system. Your staff don&apos;t need to learn anything new.
            </p>
          </section>

          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How to turn it on
            </h2>
            <ol className="mt-6 space-y-4">
              {[
                "Open your dashboard and go to Shop Setup.",
                "Under Customer experience, switch on Apple & Google Wallet passes.",
                "Save. From now on, every customer who opens their card sees the Add to Wallet button for their phone.",
                "Your wallet pass uses the same logo and brand colours as your card — set those once and they carry across.",
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
              FAQ
            </h2>
            <div className="mt-6 space-y-6">
              {[
                {
                  q: "Do customers still need an app?",
                  a: "No. Apple Wallet and Google Wallet are already built into every iPhone and Android phone — there's nothing to download. The customer taps Add to Wallet on their card and the pass appears in the wallet they already have.",
                },
                {
                  q: "Which plans include wallet passes?",
                  a: "Every plan, including Free. The Free plan is capped at 100 customers, so growing shops will upgrade as they scale — but wallet passes aren't locked behind a paywall.",
                },
                {
                  q: "Does the pass update when a customer earns a stamp?",
                  a: "Yes. When you approve a stamp, the wallet pass refreshes automatically with the new count. Customers don't have to re-add or re-open anything.",
                },
                {
                  q: "Is the wallet pass branded?",
                  a: "Yes — it carries your logo and your card's accent colour, so it looks like your cafe in the customer's wallet, not a generic Brewstamp pass.",
                },
                {
                  q: "What if a customer prefers the browser card?",
                  a: "That's completely fine. The browser card still works for everyone, on every phone. The wallet pass is an optional upgrade, not a replacement.",
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

          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Turn on wallet passes for your shop
            </h3>
            <p className="mt-2 text-stone-500">
              Already running Brewstamp? Flip the switch in Shop Setup. New
              here? Set up your branded loyalty card in 2 minutes — free.
            </p>
            <div className="mt-6">
              <Link href="/dashboard/settings">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Go to Shop Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </article>
      </main>
      <RelatedGuides />
      <Footer />
    </div>
  );
}
