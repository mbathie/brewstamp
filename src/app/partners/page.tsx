import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Link2, Percent, Wallet } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { REFERRAL_MONTHS, REFERRAL_RATE_PERCENT } from "@/lib/referrals";

export const metadata: Metadata = {
  title: "Partner program — earn 20% recurring for referring cafes",
  description:
    "Web designers, agencies and consultants: refer cafes and small businesses to Brewstamp and earn 20% of everything they pay for their first 12 months. Free to join, paid via PayPal.",
  alternates: { canonical: "/partners" },
};

const STEPS = [
  {
    icon: Link2,
    title: "Get your link",
    body: "Sign up (or sign in), open Partners in your dashboard, and copy your personal referral link. Takes a minute.",
  },
  {
    icon: Percent,
    title: "Share it with clients",
    body: "Put it in a proposal, an email, or the footer of a site you build. Anyone who signs up after clicking it is yours — for life.",
  },
  {
    icon: Wallet,
    title: "Earn as they pay",
    body: `You earn ${REFERRAL_RATE_PERCENT}% of every payment they make for their first ${REFERRAL_MONTHS} months. See it accrue in your dashboard; we pay out by PayPal each quarter.`,
  },
];

const FAQ = [
  {
    q: "Who is this for?",
    a: "Web designers, agencies, POS resellers, café consultants — anyone who talks to café and small-business owners about running their shop. If you already recommend tools, this pays you for it.",
  },
  {
    q: "How much can I earn?",
    a: `${REFERRAL_RATE_PERCENT}% of what a referred shop pays, on every payment, for ${REFERRAL_MONTHS} months from their first payment. A shop on Plus (US$19/month) is about US$45 to you over the year; a Max shop about US$70. Refer ten cafes and it adds up.`,
  },
  {
    q: "How is a referral tracked?",
    a: "Your link sets a cookie that lasts 90 days. When someone creates a Brewstamp account in that window, they're attributed to you. Last click wins. Free-plan shops count as referred, and you earn the moment they upgrade.",
  },
  {
    q: "When and how am I paid?",
    a: "Quarterly, by PayPal, once your balance is US$25 or more. Your dashboard shows what's accrued, what's been paid, and per-shop detail. Refunds and chargebacks are deducted.",
  },
  {
    q: "Can I use it for my own shop?",
    a: "No — self-referrals and referring accounts you control are excluded. Everything else is fair game.",
  },
  {
    q: "Is there a cost or a contract?",
    a: "No. It's free to join, there are no targets, and you can stop sharing the link whenever you like. Earnings already accrued are still paid.",
  },
];

export default function PartnersPage() {
  return (
    <>
      <PublicHeader />
      <main className="bg-white">
        <section className="bg-stone-50 px-6 pt-24 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              Partner program
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
              Refer a café. Earn {REFERRAL_RATE_PERCENT}% of what they pay for a year.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-500">
              Build websites for cafés? Set up their POS? Brewstamp gives their
              customers a digital loyalty card in thirty seconds. Recommend it
              with your link and you earn {REFERRAL_RATE_PERCENT}% of every
              payment for their first {REFERRAL_MONTHS} months. Free to join,
              paid via PayPal.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-amber-700 text-white hover:bg-amber-800">
                <Link href="/register?callbackUrl=%2Fdashboard%2Fpartners">
                  Get my referral link <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-stone-300 bg-white text-stone-800 hover:bg-stone-100">
                <Link href="/login?callbackUrl=%2Fdashboard%2Fpartners">I already have an account</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-stone-400">
              No approval step — your link is ready the moment you sign in.
            </p>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-stone-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <s.icon className="size-4" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-stone-200 bg-stone-50 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
                  What a referral is worth
                </h2>
                <p className="mt-3 text-stone-500">
                  Plans start at US$7/month. Most cafés land on Pro or Plus. Here&apos;s
                  what one referred shop earns you over its first year, if it stays
                  subscribed.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-stone-700">
                  {[
                    `${REFERRAL_RATE_PERCENT}% of every payment — monthly or annual`,
                    `For ${REFERRAL_MONTHS} months from their first payment`,
                    "Upgrades count — earn more when they grow",
                    "Tracked per shop in your dashboard",
                    "Paid quarterly by PayPal",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-amber-700" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                      <th className="px-5 py-3 font-semibold">Plan</th>
                      <th className="px-5 py-3 text-right font-semibold">Shop pays / mo</th>
                      <th className="px-5 py-3 text-right font-semibold">You earn / yr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Pro", 7],
                      ["Plus", 19],
                      ["Max", 29],
                    ].map(([name, price]) => (
                      <tr key={name as string} className="border-b border-stone-100 last:border-0">
                        <td className="px-5 py-3.5 font-medium text-stone-900">{name}</td>
                        <td className="px-5 py-3.5 text-right text-stone-700">US${price}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-amber-700">
                          US${Math.round(((price as number) * 12 * REFERRAL_RATE_PERCENT) / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-5 py-3 text-xs text-stone-400">
                  Illustrative, based on a monthly plan for {REFERRAL_MONTHS} months.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
              Questions
            </h2>
            <dl className="mt-10 divide-y divide-stone-200">
              {FAQ.map((f) => (
                <div key={f.q} className="py-6">
                  <dt className="font-semibold text-stone-900">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-500">{f.a}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 text-center">
              <Button asChild size="lg" className="bg-amber-700 text-white hover:bg-amber-800">
                <Link href="/register?callbackUrl=%2Fdashboard%2Fpartners">
                  Get my referral link <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <p className="mt-3 text-sm text-stone-500">
                Questions first? <Link href="/contact" className="text-amber-700 underline-offset-2 hover:underline">Get in touch</Link>.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
