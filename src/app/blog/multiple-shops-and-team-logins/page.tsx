import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Store, Download, LayoutGrid, ShieldCheck } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Multi-Shop, Team Logins, and a New Pricing Lineup",
  description:
    "Run multiple cafes under one Brewstamp account, invite managers and staff to accept stamps at the counter, and pick the plan that fits — Free, Pro, Plus, or Max.",
  alternates: { canonical: "/blog/multiple-shops-and-team-logins" },
  openGraph: {
    type: "article",
    url: "/blog/multiple-shops-and-team-logins",
    title: "Multi-Shop, Team Logins, and a New Pricing Lineup",
    description:
      "Run multiple cafes under one Brewstamp account, invite managers and staff, and pick from four plans.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=70&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Cafe team behind an espresso machine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-Shop, Team Logins, and a New Pricing Lineup",
    description:
      "Run multiple cafes under one Brewstamp account, invite managers and staff, and pick from four plans.",
    images: [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=70&auto=format&fit=crop",
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Multi-Shop, Team Logins, and a New Pricing Lineup",
  description:
    "Brewstamp now supports multiple shops under one account, team logins for managers and staff, and a refreshed plan lineup: Free, Pro, Plus, and Max.",
  author: { "@type": "Organization", name: "Brewstamp" },
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    logo: {
      "@type": "ImageObject",
      url: "https://brewstamp.app/apple-touch-icon.png",
    },
  },
  mainEntityOfPage:
    "https://brewstamp.app/blog/multiple-shops-and-team-logins",
  datePublished: "2026-05-16",
  dateModified: "2026-05-16",
  image:
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=70&auto=format&fit=crop",
};

const PLANS: Array<{
  name: string;
  price: string;
  tagline: string;
  shops: string;
  highlights: string[];
}> = [
  {
    name: "Free",
    price: "$0/mo",
    tagline: "Try it out",
    shops: "1 shop",
    highlights: ["Up to 100 stamps total", "Real-time approvals", "Customer dashboard"],
  },
  {
    name: "Pro",
    price: "$7/mo",
    tagline: "A single busy shop",
    shops: "1 shop",
    highlights: ["Unlimited stamps", "Customer analytics", "Priority support"],
  },
  {
    name: "Plus",
    price: "$19/mo",
    tagline: "Growing brands",
    shops: "Up to 3 shops",
    highlights: ["Unlimited staff logins", "CSV customer exports", "Everything in Pro"],
  },
  {
    name: "Max",
    price: "$29/mo",
    tagline: "Multi-location chains",
    shops: "Up to 10 shops",
    highlights: [
      "Cross-shop rollup reporting",
      "Priority + dedicated support",
      "Everything in Plus",
    ],
  },
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
              One account, multiple shops, your whole team
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              Brewstamp now runs up to ten cafes under a single login, lets
              you invite managers and staff to approve stamps at the
              counter, and ships a refreshed plan lineup — Free, Pro, Plus,
              and Max — so you only pay for what your shop actually needs.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-05-16">16 May 2026</time>
            </p>
          </header>

          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              The short version
            </p>
            <p className="mt-2 text-base leading-relaxed text-stone-700">
              Add another shop from the top-bar switcher. Invite team
              members on the new <strong>Team</strong> page (Plus &amp; Max
              plans). Export your customer list as a CSV. Flip to an
              &ldquo;All shops&rdquo; rollup view to see every cafe at
              once. Plan switching is prorated, so you only pay for what
              you use.
            </p>
          </div>

          <section className="mb-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Store className="size-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Run multiple shops under one account
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              If you operate a second location — or you&apos;re a roastery
              with sister cafes — you no longer need a separate login per
              site. Add a new shop from the top-bar switcher, customise its
              colours, logo, and stamp threshold, and start collecting
              stamps the same day.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Each shop keeps its own QR code, customer list, and
              branding. Switch between them from the new dropdown at the
              top of every dashboard page — your customer data and
              counter sessions stay scoped to whichever shop is currently
              selected.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm font-semibold text-stone-900">Plus</p>
                <p className="mt-1 text-sm text-stone-600">
                  Up to <strong>3 shops</strong> — perfect for a small
                  group of cafes under one brand.
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm font-semibold text-stone-900">Max</p>
                <p className="mt-1 text-sm text-stone-600">
                  Up to <strong>10 shops</strong> with cross-shop rollup
                  reporting for multi-location chains.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Users className="size-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                Invite your team
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Approving stamps from your phone works fine when it&apos;s
              just you on the bar. Once you&apos;ve got a barista on
              espresso and a manager opening up, everyone needs to be able
              to tap approve from their own device. The new{" "}
              <strong>Team</strong> page lets you invite teammates by
              email, with three roles:
            </p>
            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-amber-700" />
                  <p className="text-sm font-semibold text-stone-900">Owner</p>
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  Full control — billing, plan switching, and team
                  management. One per shop.
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-amber-700" />
                  <p className="text-sm font-semibold text-stone-900">Manager</p>
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  Everything the owner can do except billing and shop
                  deletion. Can invite and manage staff.
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-amber-700" />
                  <p className="text-sm font-semibold text-stone-900">Staff</p>
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  Day-to-day: approve stamps, see customers and tags.
                  Can&apos;t change settings or invite teammates.
                </p>
              </div>
            </div>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              Invites go out as a magic link — your teammate clicks it,
              creates an account with their email, and lands straight on
              the shop dashboard. Unlimited staff logins are included on
              Plus &amp; Max plans.
            </p>
          </section>

          <section className="mb-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <LayoutGrid className="size-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                &ldquo;All shops&rdquo; aggregate view
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              When you have more than one shop, the top-bar switcher gains
              an <strong>All shops</strong> option. Flip to it and the
              dashboard rolls up customers, stamps earned, and rewards
              redeemed across every shop you own — with a per-shop
              breakdown table underneath. Click the arrow next to any
              shop to drop straight into its single-shop view.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The customer list flips into a cross-shop table too —
              there&apos;s a <strong>Shop</strong> column so you can see
              who&apos;s loyal at which location, sortable by name, shop,
              stamps, or last visit.
            </p>
          </section>

          <section className="mb-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Download className="size-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                CSV customer exports
              </h2>
            </div>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              On Plus and Max plans, the Customers page has an{" "}
              <strong>Export CSV</strong> button that downloads your
              entire customer list — names, emails, tags, notes, stamp
              counts, redemption counts, and last-visit dates. Useful for
              one-off campaigns, importing into your email tool, or just
              keeping an offline copy.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              In &ldquo;All shops&rdquo; mode the export adds a Shop
              column so the rows still make sense without context.
            </p>
          </section>

          <section className="mb-14 rounded-2xl bg-white p-8 ring-1 ring-stone-200">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              Refreshed pricing — pick what fits
            </h2>
            <p className="mt-3 text-base leading-relaxed text-stone-600">
              Four plans. Free covers your first hundred stamps. Pro
              unlocks unlimited stamps for a single shop. Plus adds team
              logins, CSV exports, and up to three shops. Max scales up
              to ten shops with cross-shop reporting.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className="flex flex-col rounded-xl border border-stone-200 bg-stone-50 p-5"
                >
                  <p className="text-sm font-semibold text-stone-900">
                    {p.name}
                  </p>
                  {/* Reserve space for two-line taglines so the price row
                      sits at the same Y on every card regardless of how
                      long each tagline is. */}
                  <p className="mt-0.5 min-h-[2.5em] text-xs leading-tight text-stone-500">
                    {p.tagline}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-stone-900">
                    {p.price}
                  </p>
                  <p className="mt-1 min-h-[1.25em] text-xs font-medium text-amber-700">
                    {p.shops}
                  </p>
                  <ul className="mt-4 flex-1 space-y-1.5 text-xs text-stone-600">
                    {p.highlights.map((h) => (
                      <li key={h}>· {h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-stone-500">
              Switching plans is <strong>prorated</strong> — the unused
              portion of your current plan is credited automatically
              against the new plan&apos;s first invoice. No surprise
              charges and no end-of-month cliffs.{" "}
              <Link
                href="/pricing"
                className="text-amber-700 underline-offset-2 hover:underline"
              >
                See the full comparison →
              </Link>
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              FAQ
            </h2>
            <div className="mt-6 space-y-6">
              {[
                {
                  q: "I'm already a customer — does my plan change?",
                  a: "No. If you're on the existing Pro plan, your subscription is grandfathered — same price, same features. Anything you've signed up for keeps working exactly as before. The new plans are for upgrades and new signups.",
                },
                {
                  q: "Can I have a different design per shop?",
                  a: "Yes. Each shop has its own logo, colours, pattern, stamp threshold, and language. They're fully independent — they just share your login.",
                },
                {
                  q: "What does a staff login see vs. an owner?",
                  a: "Staff can approve stamps, view customers, and add tags or notes. They can't open billing, change shop settings, or invite teammates. Managers can do everything except billing and shop deletion.",
                },
                {
                  q: "Is CSV export only for Plus and up?",
                  a: "Yes — Plus and Max include CSV export. On Free and Pro you'll see the button on the Customers page but it's disabled with a tooltip pointing at the upgrade path.",
                },
                {
                  q: "What's cross-shop rollup reporting?",
                  a: "On Plus and Max, the dashboard 'All shops' view shows totals across every cafe you own — customers, stamps, rewards redeemed — plus a per-shop breakdown table. Useful for comparing locations or seeing how the brand is performing as a whole.",
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
              Ready to add a second shop?
            </h3>
            <p className="mt-2 text-stone-500">
              Already on Brewstamp? Pop open the top-bar switcher and tap
              &ldquo;Add a new shop.&rdquo; New here? Get started free —
              upgrade only when your loyalty program is taking off.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer border-stone-300 !bg-white px-8 text-base !text-stone-900 hover:!bg-stone-100"
                >
                  See pricing
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
