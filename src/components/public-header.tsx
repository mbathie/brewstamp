"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee, Menu, X } from "lucide-react";

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/alternatives", label: "Compare" },
  { href: "/blog", label: "Blog" },
  { href: "/login", label: "Sign In" },
];

export default function PublicHeader({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`${transparent ? "fixed" : "sticky"} top-0 z-50 w-full border-b border-white/10 ${transparent ? "bg-stone-900/60" : "bg-stone-900/95"} backdrop-blur-md`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-amber-700">
            <Coffee className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-[family-name:var(--font-logo)] text-2xl tracking-wide text-white">
            Brewstamp
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                className="cursor-pointer text-stone-300 hover:bg-white/10 hover:text-white"
              >
                {label}
              </Button>
            </Link>
          ))}
          <Link href="/register">
            <Button className="cursor-pointer bg-amber-700 !text-white hover:bg-amber-800">
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Mobile: primary CTA + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link href="/register">
            <Button
              size="sm"
              className="cursor-pointer bg-amber-700 !text-white hover:bg-amber-800"
            >
              Get Started Free
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-stone-300 hover:bg-white/10 hover:text-white"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <div className="border-t border-white/10 bg-stone-900/95 backdrop-blur-md sm:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-3 text-base text-stone-200 hover:bg-white/10 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
