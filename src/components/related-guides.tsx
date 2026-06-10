import Link from "next/link";

/**
 * Internal-link block that funnels link equity to the money pages that need a
 * page-1 push (see the 2026-06-10 SEO report): the /coffee-rewards-app landing
 * page and the two strongest blog guides. Uses exact-match anchor text so the
 * target pages rank for "coffee rewards app", "coffee loyalty card", and
 * "coffee shop loyalty card printing" rather than the homepage absorbing them.
 *
 * Drop this in above <Footer /> on supporting pages (alternatives, narrower
 * blog posts) — anywhere that currently dead-ends into a CTA without passing
 * equity onward.
 */
const GUIDES: Array<{ href: string; anchor: string; blurb: string }> = [
  {
    href: "/coffee-rewards-app",
    anchor: "Coffee rewards app for cafes",
    blurb: "A digital coffee rewards card customers reach by scanning a QR code — no app to download.",
  },
  {
    href: "/blog/digital-loyalty-cards-for-cafes",
    anchor: "Coffee loyalty card: the complete guide",
    blurb: "What a coffee loyalty card is, the 8-stamp rule, and how to launch one in under two minutes.",
  },
  {
    href: "/blog/coffee-shop-loyalty-card-printing",
    anchor: "Coffee shop loyalty card printing",
    blurb: "Print one QR code instead of a stack of paper punch cards. Free PDF, ready in minutes.",
  },
];

export default function RelatedGuides() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <h2 className="text-lg font-semibold text-stone-900">
        Keep reading on coffee loyalty &amp; rewards
      </h2>
      <ul className="mt-5 space-y-4">
        {GUIDES.map(({ href, anchor, blurb }) => (
          <li key={href}>
            <Link
              href={href}
              className="font-medium text-amber-700 underline-offset-2 hover:underline"
            >
              {anchor} →
            </Link>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              {blurb}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
