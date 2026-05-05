import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Coffee,
  QrCode,
  Smartphone,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import Testimonials from "@/components/testimonials";

export const metadata: Metadata = {
  title:
    "Stamp Me Alternative: Brewstamp — Free Digital Loyalty Card with No Customer App",
  description:
    "Looking for a Stamp Me alternative? Brewstamp is a free digital coffee loyalty card with no customer app, no per-stamp fees, and a flat $5/month after your first 100 stamps.",
  alternates: { canonical: "/alternatives/stamp-me" },
  openGraph: {
    type: "website",
    url: "/alternatives/stamp-me",
    title: "Stamp Me Alternative — Brewstamp",
    description:
      "A simpler, cheaper Stamp Me alternative. Free up to 100 stamps, $5/month after that, and no app for your customers to download.",
    images: [
      {
        url: "https://images.pexels.com/photos/30294330/pexels-photo-30294330.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Modern cafe interior",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stamp Me Alternative — Brewstamp",
    description:
      "A simpler, cheaper Stamp Me alternative. No customer app, free up to 100 stamps, $5/month flat after.",
    images: [
      "https://images.pexels.com/photos/30294330/pexels-photo-30294330.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Stamp Me Alternative — Brewstamp",
  description:
    "Brewstamp is a Stamp Me alternative for independent cafes — a digital coffee loyalty card with no customer app, free up to 100 stamps, and flat $5/month pricing.",
  url: "https://brewstamp.app/alternatives/stamp-me",
  about: {
    "@type": "SoftwareApplication",
    name: "Brewstamp",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
};

export default function StampMeAlternative() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader transparent />

      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <img
          src="https://images.pexels.com/photos/30294330/pexels-photo-30294330.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/75 via-stone-900/65 to-stone-900/85" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24 pb-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
              <Coffee className="h-3.5 w-3.5" />
              Stamp Me alternative
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              The simpler{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Stamp Me alternative
              </span>{" "}
              for independent cafes.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-300">
              Brewstamp is a digital coffee loyalty card built for small cafes
              that don&apos;t want to ask their customers to download an app —
              or pay $29–79 a month before serving a single coffee. Free up to
              100 stamps, $5/month flat after that.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-600 px-8 text-base hover:bg-amber-700"
                >
                  Try the free alternative
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#compare">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer border-white/20 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  See the comparison
                </Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                No customer app
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Free up to 100 stamps
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                Flat $5/month
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* In short / featured snippet */}
      <section className="border-y border-stone-200 bg-amber-50 py-12">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            In short
          </p>
          <p className="mt-2 text-lg leading-relaxed text-stone-700">
            Brewstamp is a Stamp Me alternative aimed at independent cafes that
            want a digital coffee loyalty card without paying enterprise pricing
            or asking customers to install an app. Both products do digital
            stamp cards; the main differences are <strong>customer app
            requirement</strong>, <strong>pricing model</strong>, and{" "}
            <strong>setup complexity</strong>.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" className="scroll-mt-20 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Brewstamp vs Stamp Me
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              The honest comparison
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              Pulled from each product&apos;s public pricing and feature pages.
              Last reviewed May 2026.
            </p>
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100">
                <tr>
                  <th className="px-4 py-4 font-semibold text-stone-700">
                    Feature
                  </th>
                  <th className="px-4 py-4 font-semibold text-amber-700">
                    Brewstamp
                  </th>
                  <th className="px-4 py-4 font-semibold text-stone-700">
                    Stamp Me
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {[
                  {
                    feature: "Customer app required",
                    brewstamp: { good: true, text: "No — runs in the browser" },
                    stampMe: { good: false, text: "Yes — Stamp Me app" },
                  },
                  {
                    feature: "Starting price",
                    brewstamp: {
                      good: true,
                      text: "Free up to 100 stamps total",
                    },
                    stampMe: { good: false, text: "From $29/month (Lite plan)" },
                  },
                  {
                    feature: "Full-featured plan",
                    brewstamp: {
                      good: true,
                      text: "$5/month flat (unlimited stamps)",
                    },
                    stampMe: { good: false, text: "$49–79/month" },
                  },
                  {
                    feature: "Setup time",
                    brewstamp: { good: true, text: "Under 2 minutes" },
                    stampMe: { good: null, text: "30-day free trial" },
                  },
                  {
                    feature: "Push notifications / SMS",
                    brewstamp: { good: false, text: "Not yet" },
                    stampMe: { good: true, text: "Yes (Pro & Elite)" },
                  },
                  {
                    feature: "Hardware option",
                    brewstamp: {
                      good: null,
                      text: "Print QR code yourself",
                    },
                    stampMe: { good: true, text: "StampPod tap device" },
                  },
                  {
                    feature: "Real-time merchant approval",
                    brewstamp: { good: true, text: "Yes — every stamp" },
                    stampMe: { good: true, text: "Yes" },
                  },
                  {
                    feature: "Customer insights",
                    brewstamp: { good: true, text: "Visits, frequency, churn" },
                    stampMe: { good: true, text: "Detailed analytics" },
                  },
                ].map(({ feature, brewstamp, stampMe }) => (
                  <tr key={feature} className="bg-white">
                    <td className="px-4 py-4 font-medium text-stone-800">
                      {feature}
                    </td>
                    <ComparisonCell {...brewstamp} />
                    <ComparisonCell {...stampMe} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why switch */}
      <section className="border-y border-stone-200 bg-stone-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Why cafes switch
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Reasons cafes choose Brewstamp over Stamp Me
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {[
              {
                icon: Smartphone,
                title: "Your customers don't install anything",
                desc: "Brewstamp opens in the phone browser when the customer scans the QR code. Stamp Me asks customers to download a separate Stamp Me app. The fewer steps between scan and stamp, the more regulars actually enrol.",
              },
              {
                icon: Coffee,
                title: "Pricing that fits a small cafe",
                desc: "Brewstamp's free tier covers your first 100 stamps — a real test, not a 30-day countdown. After that, $5/month flat. Stamp Me's Lite plan is $29/month before you've decided whether the program works.",
              },
              {
                icon: Zap,
                title: "Setup in 2 minutes, not 2 hours",
                desc: "Create your shop, customise the card, print the QR code. There's no hardware to ship, no in-app branding to configure across iOS and Android, and no merchant onboarding call.",
              },
              {
                icon: Shield,
                title: "Per-stamp merchant approval",
                desc: "Every stamp on Brewstamp pops up on your dashboard for approval. No auto-stamping the moment someone walks past the QR code, so card-stuffing fraud isn't a thing.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-stone-200 bg-white p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Icon className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When the competitor is better — fairness */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
            When Stamp Me might be the better fit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            We&apos;re not for everyone
          </h2>
          <p className="mt-4 text-stone-500">
            Stamp Me has been around longer and ships features Brewstamp
            doesn&apos;t — yet. Be honest about what you actually need:
          </p>
          <ul className="mt-8 space-y-5">
            {[
              {
                bold: "You want push notifications and SMS marketing.",
                text: "Stamp Me's Pro and Elite plans include direct push and SMS to customers. Brewstamp doesn't yet — we keep things lean and let your existing email tools handle marketing.",
              },
              {
                bold: "You want dedicated counter hardware.",
                text: "Stamp Me ships StampPod, a tap-to-stamp device. If your queue is genuinely fast enough that a 5-second QR scan is too slow, that hardware loop is hard to beat.",
              },
              {
                bold: "You're a multi-location chain with a marketing team.",
                text: "Stamp Me's Elite plan includes VIP support and gamification (Scratch & Win). Brewstamp is built for the independent cafe, not the franchise.",
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
        </div>
      </section>

      <Testimonials />

      {/* Pricing */}
      <section className="border-t border-stone-200 bg-stone-50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Half the price of Stamp Me Lite
            </h2>
            <p className="mx-auto mt-4 max-w-md text-stone-500">
              No tiered features locked behind enterprise plans. One simple
              price, all features.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-stone-900">Free</h3>
              <p className="mt-1 text-sm text-stone-500">No credit card</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-stone-900">$0</span>
                <span className="text-stone-500"> /month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Up to 100 stamps total
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  All core features
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  No customer app
                </li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="mt-8 w-full cursor-pointer">
                  Get started
                </Button>
              </Link>
            </div>
            <div className="relative rounded-2xl border-2 border-amber-600 bg-white p-8">
              <div className="absolute -top-3 right-6 rounded-full bg-amber-600 px-3 py-0.5 text-xs font-medium text-white">
                vs $29–79 on Stamp Me
              </div>
              <h3 className="text-lg font-semibold text-stone-900">Pro</h3>
              <p className="mt-1 text-sm text-stone-500">
                For busy shops
              </p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-stone-900">$5</span>
                <span className="text-stone-500"> /month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Unlimited stamps
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Customer insights &amp; analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Priority support
                </li>
              </ul>
              <Link href="/register">
                <Button className="mt-8 w-full cursor-pointer bg-amber-600 hover:bg-amber-700">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Stamp Me alternative — questions cafe owners ask
            </h2>
          </div>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "Is Brewstamp a free Stamp Me alternative?",
                a: "Yes — Brewstamp is free for your first 100 stamps total (not a 30-day window). After that it's $5/month for unlimited stamps, which is roughly one-sixth the cost of Stamp Me's Lite plan.",
              },
              {
                q: "Do my customers need to download a Brewstamp app?",
                a: "No. The biggest difference between Brewstamp and Stamp Me is that Brewstamp runs entirely in the customer's phone browser. They scan a QR code, the card opens — no App Store, no install. Stamp Me requires customers to download the Stamp Me app.",
              },
              {
                q: "Can I migrate my existing Stamp Me customers to Brewstamp?",
                a: "There's no automated migration — but because Brewstamp doesn't require a customer app, your regulars can move over by simply scanning your new QR code on their next visit. Run both for a few weeks and let customers self-migrate.",
              },
              {
                q: "What does Brewstamp not have that Stamp Me has?",
                a: "Push notifications, SMS marketing, the StampPod hardware device, and gamification features (Scratch & Win) are all on Stamp Me's higher tiers. We've deliberately kept Brewstamp focused on the core stamp-and-redeem flow.",
              },
              {
                q: "Is the Stamp Me app good?",
                a: "Stamp Me is a mature product with strong reviews — for cafes that want a single-app experience and have the budget for $29–79/month, it's a solid choice. Brewstamp targets a different need: cafes that don't want their customers to install anything.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-stone-200 bg-stone-50 px-6 py-5"
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
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1920&q=80&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/75" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Try the free Stamp Me alternative
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-300">
            Set up takes less than 2 minutes. Free up to 100 stamps. No
            customer app, no credit card.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-600 px-10 text-base hover:bg-amber-700"
              >
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ComparisonCell({
  good,
  text,
}: {
  good: boolean | null;
  text: string;
}) {
  return (
    <td className="px-4 py-4 text-stone-600">
      <div className="flex items-start gap-2">
        {good === true && (
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        )}
        {good === false && (
          <X className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        )}
        {good === null && (
          <span className="mt-0.5 h-4 w-4 shrink-0 text-stone-400">—</span>
        )}
        <span>{text}</span>
      </div>
    </td>
  );
}
