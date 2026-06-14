import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Printer,
  Smartphone,
  Check,
  ArrowRight,
  Store,
  Coffee,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import FeaturesCardCarousel from "@/components/features-card-carousel";

const HERO_IMG = "https://brewstamp.app/cafe-loyalty-counter.jpg";

export const metadata: Metadata = {
  title: {
    absolute: "How It Works — Set Up a Coffee Loyalty Card | Brewstamp",
  },
  description:
    "How Brewstamp works in three steps: customise your branded loyalty card, print your QR code for the counter, and approve stamps from your phone. No app for your customers — live in minutes.",
  alternates: { canonical: "/how-it-works" },
  keywords: [
    "how does a coffee loyalty card work",
    "set up a coffee loyalty program",
    "qr code loyalty program",
    "digital stamp card how it works",
    "no app loyalty card",
  ],
  openGraph: {
    type: "website",
    url: "/how-it-works",
    title: "How Brewstamp Works — Set Up a Coffee Loyalty Card",
    description:
      "Three steps: customise your card, print your QR code, approve stamps from your phone. No app for your customers.",
    images: [{ url: HERO_IMG, width: 988, height: 966 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Brewstamp Works — Set Up a Coffee Loyalty Card",
    description:
      "Three steps: customise your card, print your QR code, approve stamps from your phone.",
    images: [HERO_IMG],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to set up a coffee loyalty card with Brewstamp",
  description:
    "Set up a digital coffee loyalty card in three steps: customise your branding, print your QR code, and approve stamps from your phone.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Customise your brand",
      text: "Upload your logo, choose your colours and a background pattern, and set how many stamps earn a free coffee. The card your customers see is fully yours.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Print your QR code",
      text: "Print your unique QR poster from the dashboard and place it on the counter where customers order. They scan it with their phone camera — no app to download.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Approve stamps from your device",
      text: "When a customer scans, a stamp request appears on your phone or tablet. Tap approve and the stamp lands on their card in real time. Nothing gets stamped without you.",
    },
  ],
};

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-stone-50 to-stone-50 px-6 pt-20 pb-16 sm:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:radial-gradient(circle_at_1px_1px,rgb(120_113_108/0.18)_1px,transparent_0)] [background-size:22px_22px]"
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              How it works
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
              Your loyalty card, live in three steps
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-stone-500">
              Make the card your own, print one QR code for the counter, and
              approve stamps from your phone. Set up takes a few minutes — and
              your customers never have to download another annoying, bulky app.
            </p>

            {/* Step teaser */}
            <ol className="mx-auto mt-10 flex max-w-2xl flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center sm:gap-1.5">
              {["Customise your brand", "Print your QR code", "Approve stamps"].map(
                (label, i) => (
                  <Fragment key={label}>
                    {i > 0 && (
                      <span
                        aria-hidden
                        className="mx-auto hidden h-px w-7 shrink-0 bg-gradient-to-r from-amber-300 to-amber-400 sm:block"
                      />
                    )}
                    <li className="group flex items-center gap-2.5 rounded-full border border-amber-200/80 bg-white/80 py-1.5 pr-4 pl-1.5 shadow-sm shadow-amber-900/5 backdrop-blur-sm transition-colors hover:border-amber-300">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-xs font-bold text-white ring-2 ring-white">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold whitespace-nowrap text-stone-700">
                        {label}
                      </span>
                    </li>
                  </Fragment>
                )
              )}
            </ol>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer border-stone-300 !bg-white px-8 text-base !text-stone-900 hover:!bg-stone-100"
                >
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Step 1 — Customise your brand */}
        <section className="border-t border-stone-200 bg-white py-20">
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 md:grid-cols-2">
            <div>
              <StepEyebrow n={1} icon={Palette} label="Customise your brand" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
                Make the card look like you, not us
              </h2>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                Drop in your logo, pick your colours and a background pattern,
                and set the reward — buy eight, get one free, whatever suits your
                shop. Customers see a card that&rsquo;s unmistakably yours.
              </p>
              <StepList
                items={[
                  "Your logo, colours, and background pattern",
                  "Set your own reward (e.g. buy 8, get one free)",
                  "Speaks 14 customer languages, including Arabic",
                ]}
              />
            </div>
            <FeaturesCardCarousel />
          </div>
        </section>

        {/* Step 2 — Print your QR code */}
        <section className="border-t border-stone-200 bg-stone-50 py-20">
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 md:grid-cols-2">
            <figure className="order-last overflow-hidden rounded-3xl shadow-xl ring-1 ring-stone-200 md:order-first">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cafe-loyalty-counter.jpg"
                alt="A printed Brewstamp QR loyalty card framed on a cafe counter as a customer scans it with their phone"
                className="aspect-square w-full object-cover"
                width={988}
                height={966}
              />
            </figure>
            <div>
              <StepEyebrow n={2} icon={Printer} label="Print your QR code" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
                One QR code on the counter
              </h2>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                Print your QR poster from the dashboard and stand it where
                customers order their drink. They scan it with their phone
                camera and their card opens in the browser — no app store, no
                sign-up, nothing to carry.
              </p>
              <StepList
                items={[
                  "Print it as a counter card, A4, or window decal",
                  "Customers scan with the native phone camera",
                  "Nothing for them to download or install",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Step 3 — Approve stamps */}
        <section className="border-t border-stone-200 bg-white py-20">
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 md:grid-cols-2">
            <div>
              <StepEyebrow n={3} icon={Smartphone} label="Approve stamps" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
                You approve, right from your phone
              </h2>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                Keep your dashboard open on a phone or tablet at the counter.
                Every scan pops up as a request — tap approve and the stamp lands
                on their card in real time. Nothing gets stamped without you, so
                it can&rsquo;t be gamed.
              </p>
              <StepList
                items={[
                  "Works on any phone, tablet, or laptop",
                  "Real-time approval — no auto-stamping to fake",
                  "See who's one coffee away from a free one",
                ]}
              />
            </div>
            <ApprovalMock />
          </div>
        </section>

        {/* Reassurance band */}
        <section className="border-t border-stone-200 bg-stone-900 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  icon: Smartphone,
                  title: "No app to download",
                  body: "Customers scan and the card opens in their browser. No app store, no account.",
                },
                {
                  icon: Store,
                  title: "No hardware",
                  body: "Just a printed QR and your dashboard on any phone, tablet, or laptop.",
                },
                {
                  icon: Coffee,
                  title: "Free to start",
                  body: "Run a real loyalty card free for your first 100 stamps. No card details.",
                },
              ].map((c) => (
                <div key={c.title} className="text-center sm:text-left">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-700/20 sm:mx-0">
                    <c.icon className="size-5 text-amber-400" />
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
              Ready in about two minutes
            </h2>
            <p className="mx-auto mt-3 max-w-md text-stone-500">
              Customise your card, print the QR, pop it on the counter.
              That&rsquo;s it — you&rsquo;re collecting stamps.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer border-stone-300 !bg-white px-8 text-base !text-stone-900 hover:!bg-stone-100"
                >
                  Explore features
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function StepEyebrow({
  n,
  icon: Icon,
  label,
}: {
  n: number;
  icon: typeof Palette;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
        <Icon className="size-5 text-amber-700" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
        Step {n} · {label}
      </p>
    </div>
  );
}

function StepList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-2.5 text-sm text-stone-600">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-amber-700" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/* A small CSS mock of the barista's phone showing a stamp request to approve. */
function ApprovalMock() {
  return (
    <div className="mx-auto w-full max-w-[18rem]">
      <div className="rounded-[2.25rem] border-[10px] border-stone-900 bg-stone-900 shadow-2xl">
        <div className="overflow-hidden rounded-[1.5rem] bg-stone-50">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[11px] font-medium text-stone-400">
            <span>9:41</span>
            <span className="font-semibold text-stone-500">Brewstamp</span>
            <span>●●●</span>
          </div>

          <div className="px-4 pb-6">
            {/* request card */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                  SJ
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">
                    New stamp request
                  </p>
                  <p className="text-xs text-stone-400">Sarah · just now</p>
                </div>
              </div>

              {/* stamp progress */}
              <div className="mt-4 flex gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < 5
                        ? "h-5 flex-1 rounded-full bg-amber-600"
                        : "h-5 flex-1 rounded-full border-2 border-dashed border-stone-300"
                    }
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-stone-400">
                5 of 8 — 3 to a free coffee
              </p>

              {/* actions */}
              <div className="mt-4 flex gap-2">
                <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-700 py-2 text-sm font-semibold text-white">
                  <Check className="size-4" />
                  Approve
                </div>
                <div className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-500">
                  Decline
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-stone-400">
              Tap approve — the stamp appears on Sarah&rsquo;s card instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
