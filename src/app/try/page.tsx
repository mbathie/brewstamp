import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Try a Free Digital Loyalty Card",
  description:
    "Set up a digital stamp card for your cafe in 2 minutes. Customers scan a QR code — no app to download. Free to get started.",
  alternates: { canonical: "/try" },
  openGraph: {
    title: "Try Brewstamp — Free Digital Loyalty Card for Cafes",
    description:
      "Set up a digital stamp card for your cafe in 2 minutes. Customers scan a QR code — no app to download. Free to get started.",
    url: "/try",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Try Brewstamp — Free Digital Loyalty Card for Cafes",
    description:
      "Set up a digital stamp card for your cafe in 2 minutes. Customers scan a QR code — no app to download.",
  },
};

export default function TryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-b from-stone-900 via-stone-800 to-stone-700 pt-28 pb-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Your cafe&apos;s digital
            <br />
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              loyalty card
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg text-stone-300">
            Replace paper stamp cards with a QR code at the counter. Takes 2
            minutes to set up — free to start.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
              >
                Set up your shop — it&apos;s free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cafe counter photo */}
      <section className="bg-gradient-to-b from-stone-700 to-stone-50 pb-16 pt-4">
        <div className="mx-auto max-w-xl px-6">
          <img
            src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-cafe-qr.jpg"
            alt="QR code printed out on a cafe counter"
            className="w-full rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* 3 Bullets */}
      <section className="border-y border-stone-200 bg-stone-50 py-16">
        <div className="mx-auto max-w-md px-6">
          <ul className="space-y-5">
            {[
              "Free to get started — no credit card",
              "No app download for your customers",
              "Works on any phone with a camera",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <span className="text-lg font-medium text-stone-800">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Loyalty card screenshot */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-md px-6 text-center">
          <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-amber-700">
            What your customers see
          </p>
          <img
            src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-loyalty-card.png"
            alt="Example branded loyalty card on a phone"
            className="mx-auto w-full rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-stone-200 bg-stone-50 py-16">
        <div className="mx-auto max-w-lg px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
            Ready to try it?
          </h2>
          <p className="mt-3 text-stone-500">
            Create your shop, print your QR code, and start stamping today.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
              >
                Set up your shop — it&apos;s free
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
