import Link from "next/link";
import Image from "next/image";
import { Coffee, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600">
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

        <div className="mt-10 border-t border-stone-100 pt-6 text-center text-xs text-stone-400">
          Made with <Heart className="inline h-3 w-3 fill-red-500 text-red-500" /> in Brunswick Heads, Australia 2026
        </div>
      </div>
    </footer>
  );
}
