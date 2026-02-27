import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Digital Loyalty Cards for Cafes: The Complete Guide (2026)",
  description:
    "Everything cafe owners need to know about digital loyalty cards. How they work, what they cost, and why they outperform paper stamp cards.",
  openGraph: {
    title: "Digital Loyalty Cards for Cafes: The Complete Guide (2026)",
    description:
      "Everything cafe owners need to know about digital loyalty cards. How they work, what they cost, and why they outperform paper stamp cards.",
  },
};

export default function BlogPost() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-28 pb-16">
        <article>
          <header className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Guide
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Digital Loyalty Cards for Cafes: The Complete Guide
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Paper stamp cards get lost, forgotten, and faked. Digital loyalty
              cards fix all three problems — and they&apos;re easier to set up
              than you think.
            </p>
          </header>

          {/* Section 1 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What is a digital loyalty card?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              A digital loyalty card replaces the traditional paper stamp card
              with a phone-based version. Instead of carrying a physical card
              and getting it stamped, your customers scan a QR code at the
              counter and collect stamps on their phone.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The key difference from apps like Stocard or loyalty apps from big
              chains: your customers don&apos;t need to download anything. The
              entire experience runs in their phone&apos;s browser. They scan,
              they see their card, they collect stamps.
            </p>
          </section>

          {/* Image break */}
          <img
            src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-cafe-qr.jpg"
            alt="QR code printed out on a cafe counter"
            className="mb-14 w-full rounded-2xl"
          />

          {/* Section 2 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why cafes are switching from paper to digital
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              If you&apos;ve ever found a stack of half-stamped cards in your
              tip jar, you already know the problem with paper. But the real
              cost goes deeper:
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  bold: "Lost cards = lost regulars.",
                  text: "A customer with 7 out of 10 stamps who loses their card doesn't start over — they just stop caring about the program entirely.",
                },
                {
                  bold: "No data.",
                  text: "Paper cards tell you nothing about who your customers are, how often they visit, or when they stop coming.",
                },
                {
                  bold: "Fraud.",
                  text: "Any stamp with a similar shape can fake a paper card. Digital stamps require merchant approval, making them impossible to game.",
                },
                {
                  bold: "Printing costs add up.",
                  text: "Cards, stamps, ink — it's a small recurring expense that digital eliminates entirely.",
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

          {/* Section 3 */}
          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How digital loyalty works in a cafe
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Here&apos;s what a typical transaction looks like:
            </p>
            <ol className="mt-6 space-y-4">
              {[
                "Customer walks up to the counter and orders their coffee.",
                "They scan the QR code on the counter with their phone camera — no app needed.",
                "A stamp request pops up on your dashboard. You tap approve.",
                "The stamp appears on their digital card in real time.",
                "After enough stamps (you set the number), they earn a free drink.",
              ].map((step, i) => (
                <li key={i} className="flex gap-4 text-base leading-relaxed text-stone-600">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              The entire process takes less than 5 seconds. It doesn&apos;t slow
              down the queue, and it works on any phone with a camera — iPhone,
              Android, even older models.
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

          {/* Section 4 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              What to look for in a digital loyalty solution
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Not all digital loyalty platforms are built for small cafes. Many
              are designed for large chains and come with enterprise pricing to
              match. Here&apos;s what matters for independent cafes:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "No app download",
                  text: "Every extra step between your customer and their stamp is a customer lost. The best solutions work entirely in the browser.",
                },
                {
                  title: "Simple pricing",
                  text: "Avoid platforms that charge per transaction or take a percentage. Look for flat monthly fees or free tiers.",
                },
                {
                  title: "Quick setup",
                  text: "You should be able to go from sign-up to printed QR code in under 5 minutes.",
                },
                {
                  title: "Works without Wi-Fi",
                  text: "The QR code should open a web page, not require a specific app installed on the customer's phone.",
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
          </section>

          {/* Section 5 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How much does a digital loyalty card cost?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Pricing varies widely. Enterprise solutions like Stamp Me or
              Loyverse can run $30–100+/month. Simpler solutions built
              specifically for cafes are more affordable.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Brewstamp, for example, is free for your first 100 stamps — enough
              to test if a loyalty program works for your shop. After that,
              it&apos;s $5/month for unlimited stamps.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Getting started
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The best way to test a digital loyalty card is to just try it.
              Most cafe owners are surprised how quickly their regulars adopt it
              — especially when there&apos;s nothing to download.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Print the QR code, stick it at the counter, and mention it when
              regulars order. You&apos;ll know within a week whether it&apos;s
              a fit.
            </p>
          </section>

          {/* CTA */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">
              Try it free — takes 2 minutes
            </h3>
            <p className="mt-2 text-stone-500">
              Set up your digital loyalty card and print your QR code today.
            </p>
            <div className="mt-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-600 px-8 text-base hover:bg-amber-700"
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
