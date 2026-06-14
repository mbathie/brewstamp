import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Multi-Language Loyalty Cards: 14 Languages, Same QR Code",
  description:
    "Brewstamp now translates your customer-facing loyalty card and printable QR PDF into 14 languages — English, Spanish, French, German, Portuguese, Italian, Mandarin, Japanese, Korean, Arabic, Hindi, Indonesian, Filipino, and Turkish.",
  alternates: { canonical: "/blog/multi-language-loyalty-card" },
  openGraph: {
    type: "article",
    url: "/blog/multi-language-loyalty-card",
    title: "Multi-Language Loyalty Cards: 14 Languages, Same QR Code",
    description:
      "Brewstamp now translates your customer-facing loyalty card and printable QR PDF into 14 languages.",
    images: [
      {
        url: "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Cafe counter with espresso machine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-Language Loyalty Cards: 14 Languages, Same QR Code",
    description:
      "Brewstamp now translates your customer-facing loyalty card into 14 languages.",
    images: [
      "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Multi-Language Loyalty Cards: 14 Languages, Same QR Code",
  description:
    "Brewstamp now translates your customer-facing loyalty card and printable QR PDF into 14 languages.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage: "https://brewstamp.app/blog/multi-language-loyalty-card",
  datePublished: "2026-05-10",
  dateModified: "2026-06-14",
  image:
    "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

const LANGUAGES: Array<{ flag: string; name: string; native: string; hello: string }> = [
  { flag: "🇺🇸", name: "English", native: "English", hello: "Hello" },
  { flag: "🇸🇦", name: "Arabic", native: "العربية", hello: "مرحبا" },
  { flag: "🇵🇭", name: "Filipino", native: "Filipino", hello: "Kumusta" },
  { flag: "🇫🇷", name: "French", native: "Français", hello: "Bonjour" },
  { flag: "🇩🇪", name: "German", native: "Deutsch", hello: "Hallo" },
  { flag: "🇮🇳", name: "Hindi", native: "हिन्दी", hello: "नमस्ते" },
  { flag: "🇮🇩", name: "Indonesian", native: "Bahasa Indonesia", hello: "Halo" },
  { flag: "🇮🇹", name: "Italian", native: "Italiano", hello: "Ciao" },
  { flag: "🇯🇵", name: "Japanese", native: "日本語", hello: "こんにちは" },
  { flag: "🇰🇷", name: "Korean", native: "한국어", hello: "안녕하세요" },
  { flag: "🇨🇳", name: "Mandarin Chinese", native: "中文", hello: "你好" },
  { flag: "🇵🇹", name: "Portuguese", native: "Português", hello: "Olá" },
  { flag: "🇪🇸", name: "Spanish", native: "Español", hello: "Hola" },
  { flag: "🇹🇷", name: "Turkish", native: "Türkçe", hello: "Merhaba" },
];

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
              14 languages, same QR code
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Your customer-facing loyalty card and your printable QR PDF
              now translate into fourteen languages — flip a single setting in
              Shop Setup and the entire customer experience switches over.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-05-10">10 May 2026</time>
            </p>
          </header>

          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The short version
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              Open <strong>Shop Setup → Loyalty → Customer-facing language</strong>,
              pick from the 14 supported languages, save. Every customer who
              scans your QR code from then on gets the card in that language.
              Your dashboard and admin tools stay in English.
            </p>
          </div>

          <figure className="mb-14 rounded-2xl bg-stone-100 px-6 py-8">
            <img
              src="/world-map.svg"
              alt="World map illustrating Brewstamp's 14 supported languages"
              className="mx-auto w-full max-w-2xl opacity-70"
              loading="lazy"
            />
            <figcaption className="mt-4 text-center text-xs text-stone-400">
              Customers from anywhere can scan and earn stamps in their own language.
            </figcaption>
          </figure>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              The 14 languages
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              We picked the languages that cover the largest share of cafe
              customers worldwide. They translate every customer-visible
              string — buttons, progress text, the &ldquo;buy 8, get one
              free&rdquo; headline on the printed PDF, the &ldquo;waiting
              for approval&rdquo; status, all of it.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {LANGUAGES.map(({ flag, name, native, hello }) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {flag}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-stone-900">
                        {native}
                      </p>
                      <p className="text-xs text-stone-500">{name}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-amber-700">
                    {hello}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Why it matters
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Loyalty programs only work when the next step is obvious to the
              customer. If your regulars are reading {"\""}Request Stamp{"\""} in a
              language they don&apos;t use day-to-day, they hesitate, miss the
              CTA, and bail out. Translating the card into the language your
              customers actually order coffee in is the single biggest
              friction-reducer we&apos;ve shipped this quarter.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              For multi-cultural cafe neighbourhoods (Sydney&apos;s Inner West,
              London&apos;s Brick Lane, San Francisco&apos;s Mission), this
              means a Mandarin or Spanish-speaking regular gets the same
              effortless tap-and-stamp experience as an English speaker.
            </p>
          </section>

          <section className="mb-14 rounded-2xl bg-stone-100 p-8">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              How to switch language
            </h2>
            <ol className="mt-6 space-y-4">
              {[
                "Open your dashboard and go to Shop Setup.",
                "In the Loyalty section, pick a language from the Customer-facing language dropdown.",
                "The right-hand Customer Preview updates instantly — every string switches in place.",
                "Auto-save kicks in 3 seconds later. You can also re-print your QR PDF; it now uses the new language too.",
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
                  q: "Does my dashboard switch language too?",
                  a: "No. The dashboard is owner-facing and stays in English. Only the customer-visible card, the printable QR PDF, and on-card progress text translate.",
                },
                {
                  q: "Can different customers see different languages?",
                  a: "Right now, the language is set per shop — every customer at your shop sees the language you picked. Per-customer toggle is on the roadmap.",
                },
                {
                  q: "What about right-to-left languages like Arabic?",
                  a: "Arabic is fully supported, including RTL layout direction on the customer card.",
                },
                {
                  q: "Can I request a language that isn't on the list?",
                  a: "Yes — email hello@brewstamp.app and we'll prioritise based on demand. The translation system makes it cheap to add more.",
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
              Switch your shop&apos;s language now
            </h3>
            <p className="mt-2 text-stone-500">
              Already running Brewstamp? Open Shop Setup and pick a language.
              New here? Set up your shop in 2 minutes.
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
      <Footer />
    </div>
  );
}
