import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Loyalty App Comparisons for Cafes",
  description:
    "Compare Brewstamp to other digital loyalty apps for cafes — Stamp Me, Loopy Loyalty, and PunchPass. Honest pricing and feature breakdowns.",
  alternates: { canonical: "/alternatives" },
  openGraph: {
    type: "website",
    url: "/alternatives",
    title: "Loyalty App Comparisons — Brewstamp",
    description:
      "Honest comparisons between Brewstamp and other digital loyalty apps for cafes.",
    images: [
      {
        url: "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Barista handing a coffee cup to a customer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loyalty App Comparisons — Brewstamp",
    description:
      "Honest comparisons between Brewstamp and other digital loyalty apps for cafes.",
    images: [
      "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const comparisons = [
  {
    slug: "stamp-me",
    competitor: "Stamp Me",
    summary:
      "Stamp Me is a mature loyalty platform with a customer-facing app and tiered $29–79/month pricing. Brewstamp is the simpler, browser-based, free-to-start alternative.",
    image:
      "https://images.pexels.com/photos/30294330/pexels-photo-30294330.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Modern cafe interior",
  },
  {
    slug: "loopy-loyalty",
    competitor: "Loopy Loyalty",
    summary:
      "Loopy Loyalty delivers cards as Apple/Google Wallet passes from $25/month. Brewstamp is the cheaper, browser-based alternative with no Wallet-pass setup.",
    image:
      "https://images.pexels.com/photos/30267627/pexels-photo-30267627.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Barista pouring coffee",
  },
  {
    slug: "punchpass",
    competitor: "PunchPass",
    summary:
      "PunchPass is a similar simple loyalty tool for cafes. Brewstamp differs on free-tier generosity, public pricing, and per-stamp merchant approval.",
    image:
      "https://images.pexels.com/photos/4787613/pexels-photo-4787613.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Pour-over coffee being prepared",
  },
];

export default function AlternativesIndex() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-28 pb-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
          Comparisons
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
          Brewstamp vs other loyalty apps
        </h1>
        <p className="mt-3 text-lg text-stone-500">
          Honest comparisons against the other digital loyalty platforms cafe
          owners consider. Pricing and features pulled from each
          product&apos;s public website. Last reviewed May 2026.
        </p>
        <div className="mt-10 space-y-6">
          {comparisons.map((c) => (
            <Link
              key={c.slug}
              href={`/alternatives/${c.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow hover:shadow-md sm:flex-row"
            >
              <div className="relative w-full shrink-0 overflow-hidden bg-stone-100 sm:w-56 md:w-64">
                <img
                  src={c.image}
                  alt={c.imageAlt}
                  loading="lazy"
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-full"
                />
              </div>
              <div className="flex-1 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Brewstamp vs {c.competitor}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-snug text-stone-900">
                  The {c.competitor} alternative for independent cafes
                </h2>
                <p className="mt-2 text-stone-500">{c.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
