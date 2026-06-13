import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Coffee,
  ShieldCheck,
  Timer,
  BarChart3,
  Building2,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Corporate Perk Mode: Subsidised Staff Coffee From One QR Code",
  description:
    "Give your team a coffee perk without vouchers, apps, or spreadsheets. Brewstamp's corporate perk mode turns a cafe QR code into an employer-subsidised staff coffee benefit — gated to your work email, capped per person per day, with reimbursement-ready reports.",
  alternates: { canonical: "/blog/corporate-coffee-perk" },
  openGraph: {
    type: "article",
    url: "/blog/corporate-coffee-perk",
    title: "Corporate Perk Mode: Subsidised Staff Coffee From One QR Code",
    description:
      "Turn a cafe QR code into an employer-subsidised staff coffee perk — gated to your work email, capped per person per day, with reports for reimbursement.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=1600&q=70&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "A flat white coffee served on a wooden tray",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corporate Perk Mode: Subsidised Staff Coffee From One QR Code",
    description:
      "Turn a cafe QR code into an employer-subsidised staff coffee perk — gated to your work email, capped per person per day, with reports for reimbursement.",
    images: [
      "https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=1600&q=70&auto=format&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Corporate Perk Mode: Subsidised Staff Coffee From One QR Code",
  description:
    "Brewstamp's corporate perk mode turns a cafe QR code into an employer-subsidised staff coffee benefit — gated to a company email domain, capped per person per local day, with per-person redemption reports for reimbursement.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/corporate-coffee-perk",
  datePublished: "2026-06-13",
  dateModified: "2026-06-13",
  image:
    "https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=1600&q=70&auto=format&fit=crop",
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
              Subsidised staff coffee, run from one QR code
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Plenty of companies want to give their team a coffee perk — but
              doing it with paper vouchers, a corporate account at every cafe,
              or a monthly reconciliation spreadsheet is more hassle than
              it&apos;s worth. <strong>Corporate perk mode</strong> turns a
              Brewstamp shop into an employer-subsidised coffee benefit:
              staff scan a QR code at the counter, enter their work email,
              and walk away with a free coffee — capped per person, per day,
              with a clean report the company can reimburse against.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-06-13">13 June 2026</time>
            </p>
          </header>

          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The short version
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              Flip a shop into <strong>perk mode</strong> in settings.
              Restrict it to your company&apos;s email domain. Set a daily
              free-coffee limit per person. Staff scan the QR, enter their
              work email, and collect — no stamps, no app, no account.
              Per-person redemption reports make reimbursement simple. Perk
              mode is included on the <strong>Plus</strong> and{" "}
              <strong>Max</strong> plans.
            </p>
          </div>

          <section className="mb-14 grid items-start gap-8 md:grid-cols-[1fr_240px]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Coffee className="size-5 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                  Every scan is a free coffee, not a stamp
                </h2>
              </div>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                A normal Brewstamp loyalty card has customers collect stamps
                toward a reward. Perk mode is different: there are no stamps to
                count. Each approved scan is simply one free coffee, drawn from
                the perk the employer is paying for. It&apos;s the office
                coffee benefit, run from the same QR code and the same
                approve-from-your-phone flow your baristas already know.
              </p>
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                For the staff member it couldn&apos;t be simpler — scan, enter
                their work email the first time, and the barista taps approve.
                No app to install, no loyalty account to create, nothing to
                carry.
              </p>
            </div>
            <figure className="mx-auto w-full max-w-[240px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/blog/corporate-perk-card.png"
                alt="Brewstamp corporate perk card on a phone — Nexus Technologies staff coffee perk showing two of two free coffees left today"
                className="w-full rounded-[2rem] border border-stone-200 shadow-xl"
              />
              <figcaption className="mt-3 text-center text-xs text-stone-400">
                The staff-facing card — branded to the company.
              </figcaption>
            </figure>
          </section>

          <section className="mb-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <ShieldCheck className="size-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Locked to your team
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The perk is gated to the company&apos;s email domain. Only
              someone with a matching work email can redeem — a random
              passer-by can&apos;t claim a subsidised coffee. There&apos;s
              nothing to provision in advance: anyone on the team can start
              using it on day one, and people who leave simply lose access
              when their email stops working.
            </p>
          </section>

          <section className="mb-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Timer className="size-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                A fair daily cap
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Set how many free coffees each person gets per day — most
              companies pick one or two. The cap is counted by{" "}
              <strong>work email, not device</strong>, so nobody can reset
              their allowance by switching to a second phone or browser. It
              rolls over at midnight in your cafe&apos;s timezone, so the
              perk is predictable and the spend stays controlled.
            </p>
          </section>

          <section className="mb-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <BarChart3 className="size-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Reimbursement-ready reporting
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The dashboard tracks free coffees redeemed per person, so when
              it&apos;s time to invoice the company you&apos;ve got the
              numbers to back it up. Export the list as a CSV and the
              employer can reconcile it line by line — who redeemed, how
              many, over what period. No counting cups, no guesswork.
            </p>
          </section>

          <section className="mb-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Building2 className="size-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Who it&apos;s for
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              For an <strong>employer</strong>, it&apos;s an easy, genuinely
              loved perk — a real coffee from a real local cafe, not a
              vending machine or a voucher code that expires. For the{" "}
              <strong>cafe</strong>, it&apos;s a standing corporate account:
              a nearby office or co-working space sends its whole team your
              way, every working day, on a tab the company is happy to pay.
            </p>
          </section>

          <section className="mb-14 rounded-2xl bg-white p-8 ring-1 ring-stone-200">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Setting it up
            </h2>
            <ol className="mt-4 space-y-3 text-base leading-relaxed text-stone-600">
              <li>
                <strong>1.</strong> Create a shop for the perk (keep it
                separate from any normal stamp-card shop), and turn on{" "}
                <strong>perk mode</strong> in settings.
              </li>
              <li>
                <strong>2.</strong> Add the company&apos;s email domain so
                only their staff can redeem.
              </li>
              <li>
                <strong>3.</strong> Set the daily free-coffee limit per
                person and confirm your timezone.
              </li>
              <li>
                <strong>4.</strong> Print or display the QR code at the
                counter — that&apos;s it. Staff scan, enter their work email,
                you approve.
              </li>
            </ol>
            <p className="mt-6 text-sm text-stone-500">
              Perk mode is on the Plus and Max plans.{" "}
              <Link
                href="/pricing"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                See the full comparison →
              </Link>
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              FAQ
            </h2>
            <div className="mt-6 space-y-6">
              {[
                {
                  q: "Do staff need an app or an account?",
                  a: "No. They scan the QR code at the counter, enter their work email the first time, and the barista approves. Nothing to install, no loyalty account to create.",
                },
                {
                  q: "How is the company billed?",
                  a: "Brewstamp tracks how many free coffees each person redeemed and lets you export it as a CSV. The cafe and company agree their own terms — the report gives you the exact figures to invoice and reconcile against.",
                },
                {
                  q: "Can someone get extra free coffees with a second phone?",
                  a: "No. The daily cap is counted by work email, not by device or browser cookie, so the same person can't double up by switching phones.",
                },
                {
                  q: "Can I run a normal stamp card and a perk in the same shop?",
                  a: "They're separate modes — run the perk in its own dedicated shop. If you switch an existing stamp-card shop into perk mode, its stamp history no longer applies, so we recommend creating a new shop for the perk instead.",
                },
                {
                  q: "Which plans include perk mode?",
                  a: "Plus and Max. You can set it up the same day you upgrade.",
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
              Run a coffee perk for your team
            </h3>
            <p className="mt-2 text-stone-500">
              Already on Brewstamp? Upgrade to Plus or Max and flip a shop
              into perk mode. New here? Get started free and explore how it
              works first.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
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
        </article>
      </main>
      <Footer />
    </div>
  );
}
