import Link from "next/link";
import Image from "next/image";
import { Coffee, Heart } from "lucide-react";

const LANGUAGES: Array<{ code: string; label: string; flag: string }> = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "id", label: "Bahasa", flag: "🇮🇩" },
  { code: "fil", label: "Filipino", flag: "🇵🇭" },
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700">
                <Coffee className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-[family-name:var(--font-logo)] text-lg tracking-wide text-stone-900">
                Brewstamp
              </span>
            </div>
            <p className="mt-3 text-sm text-stone-500">
              Digital loyalty stamps for cafes and small businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Product</h3>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <Link href="/login" className="transition-colors hover:text-stone-900">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition-colors hover:text-stone-900">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-stone-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/alternatives" className="transition-colors hover:text-stone-900">
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-stone-900">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <Link href="/terms" className="transition-colors hover:text-stone-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-stone-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-stone-900">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legacy */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Legacy</h3>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <a
                  href="https://stampystamp.com.au/signin/merchant"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-stone-900"
                >
                  <Image src="/stampystamp-smile.png" alt="Stampy Stamp" width={14} height={14} className="opacity-60" />
                  StampyStamp merchant login
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Languages — keeps internal links to localized landings so Google
            (and humans) can discover them from any page. */}
        <div className="mt-10 border-t border-stone-100 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Languages
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-500">
            <Link
              href="/"
              hrefLang="en"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-stone-900"
            >
              <span aria-hidden>🇺🇸</span>
              English
            </Link>
            {LANGUAGES.map((lang) => (
              <Link
                key={lang.code}
                href={`/${lang.code}`}
                hrefLang={lang.code}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-stone-900"
              >
                <span aria-hidden>{lang.flag}</span>
                {lang.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-stone-100 pt-6 text-center text-xs text-stone-500">
          Made with <Heart className="inline h-3 w-3 fill-red-500 text-red-500" /> in Brunswick Heads, Australia 2026
        </div>
      </div>
    </footer>
  );
}
