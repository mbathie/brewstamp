import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coffee, LayoutGrid, ListFilter, ShieldCheck, Stamp, Store, Users } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { modifiedDate } from "@/lib/content-dates";

const PATH = "/blog/multi-location-cafe-loyalty-program";
const TITLE = "Running a Loyalty Program Across Multiple Cafes: Shops, Staff and Access";
const DESCRIPTION =
  "How to run one loyalty program across several cafe locations: every shop under one account, an all-shops dashboard, and team logins scoped to the shops each person works at.";
const IMAGE =
  "https://images.pexels.com/photos/30267627/pexels-photo-30267627.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "article",
    url: PATH,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: IMAGE, width: 1200, height: 630, alt: "Barista pouring coffee" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE],
  },
};

const FAQ = [
  {
    q: "Do customers' stamps carry across my shops?",
    a: "Each shop has its own card, so a customer collects at each location separately and sees every card they hold in one place on their phone. That keeps each shop's reward and stamp count its own, which matters when locations run different offers.",
  },
  {
    q: "Does each extra shop cost more?",
    a: "No. One plan covers every shop you own: Business includes up to 3, and a Custom plan covers bigger groups. A shop that's covered by your plan has no billing of its own.",
  },
  {
    q: "What happens to my team when I open a new shop?",
    a: "Anyone you've given All shops access is added to the new shop automatically, with the same role. Everyone else keeps exactly the shops you picked for them.",
  },
  {
    q: "Can a barista at one shop see another shop's customers?",
    a: "Only if you give them access to that shop. Each person sees the shops they're on and nothing else.",
  },
  {
    q: "Who can add or remove stamps by hand?",
    a: "Owners and managers. Staff approve scans at the counter but can't change a card directly, and every manual change is logged with who made it and why.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    author: { "@type": "Organization", name: "Brewstamp" },
    publisher: {
      "@type": "Organization",
      name: "Brewstamp",
      logo: { "@type": "ImageObject", url: "https://brewstamp.app/apple-touch-icon.png" },
    },
    mainEntityOfPage: `https://brewstamp.app${PATH}`,
    datePublished: "2026-10-29",
    dateModified: modifiedDate(PATH, "2026-10-29"),
    image: IMAGE,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];

const ROLES = [
  {
    icon: ShieldCheck,
    role: "Owner",
    body: "Everything, including billing and the plan. Adds shops and decides who gets access to what.",
  },
  {
    icon: LayoutGrid,
    role: "Manager",
    body: "Runs the shop day to day: shop setup, the team, and fixing a customer's stamps when something goes wrong.",
  },
  {
    icon: Coffee,
    role: "Staff",
    body: "Approves stamps at the counter and looks up customers. Can't change settings or stamps by hand.",
  },
];

function SectionHeading({ icon: Icon, children }: { icon: typeof Store; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
        <Icon className="size-5 text-amber-700" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-stone-900">{children}</h2>
    </div>
  );
}

export default function BlogPost() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-28 pb-16">
        <article>
          <header className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">Product update</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              One loyalty program, every location, the right people on each
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-stone-500">
              The second shop is where loyalty programs usually get messy:
              a shared login on the counter iPad, a barista who can see a
              shop they don&apos;t work at, and an afternoon of setup every
              time you open somewhere new. Here&apos;s how Brewstamp handles
              a group of cafes now.
            </p>
            <p className="mt-3 text-sm text-stone-400">
              Published <time dateTime="2026-10-29">29 Oct 2026</time>
            </p>
          </header>

          <div className="mb-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">The short version</p>
            <ul className="mt-3 space-y-2 text-base leading-relaxed text-stone-700">
              <li>· Every shop sits under one account and one plan, each with its own card, QR code and customers.</li>
              <li>· An <strong>All shops</strong> dashboard shows the whole group at once, with a breakdown per location.</li>
              <li>· Each team member gets their own login, on just the shops you choose, or on all of them, including ones you open later.</li>
              <li>· Owners and managers can fix a customer&apos;s stamps; staff run the counter. Every change is logged.</li>
            </ul>
          </div>

          <section className="mb-14">
            <SectionHeading icon={Store}>Every shop under one account</SectionHeading>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Add a location from the shop switcher at the top of the
              dashboard and it&apos;s ready the same day. Each shop keeps
              its own card design, logo, stamp rules, language and QR code,
              so a beachside kiosk and a city roastery can run different
              rewards under the same account. Customers who visit more than
              one of your shops see all their cards together on their phone.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The switcher is searchable, which starts to matter at five or
              ten locations. And there&apos;s one bill: your plan covers
              every shop you own. Business includes up to three; larger
              groups go on a Custom plan sized to them. Our biggest group
              today runs on a plan for 25 shops.
            </p>
          </section>

          <section className="mb-14">
            <SectionHeading icon={LayoutGrid}>See the whole group at once</SectionHeading>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Pick <strong>All shops</strong> in the switcher and the
              dashboard adds everything up: stamps given, rewards redeemed,
              customers and new customers, across every location. A table
              underneath breaks it down per shop, so you can see at a glance
              which site is growing and which needs a nudge, then click
              straight into that shop.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The customer list works the same way, with a Shop column so
              you can see who&apos;s loyal where.
            </p>
          </section>

          <section className="mb-14">
            <SectionHeading icon={Users}>Give each person the shops they work at</SectionHeading>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Invite someone by email from the <strong>Team</strong> page
              and choose which shops they can use. A barista who only works
              the Saturday shift at one location gets that location and
              nothing else. An area manager who covers the whole group gets{" "}
              <strong>All shops</strong>, and that includes any shop you
              open later: they&apos;re added to it automatically, with the
              same role, so there&apos;s no re-inviting when you expand.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {ROLES.map(({ icon: Icon, role, body }) => (
                <div key={role} className="rounded-xl border border-stone-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-amber-700" />
                    <p className="text-sm font-semibold text-stone-900">{role}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              Everyone signs in with their own email, so when someone moves
              on you remove their access and nothing else changes. No
              shared password to rotate on the counter tablet.
            </p>
          </section>

          <section className="mb-14">
            <SectionHeading icon={ListFilter}>One team list, filtered your way</SectionHeading>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              The Team page lists everyone across all your shops, including
              invites that haven&apos;t been accepted yet. Filter it by shop
              to see who works where, or by role to find every manager in
              the group, and change someone&apos;s shops or role in a couple
              of clicks.
            </p>
          </section>

          <section className="mb-14">
            <SectionHeading icon={Stamp}>Who can change a customer&apos;s stamps</SectionHeading>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Mistakes happen at a busy counter: a card stamped twice, a
              reward that should have been given. Owners and managers can
              add stamps, take them off, or redeem a reward from the
              customer&apos;s page, and each change is recorded in the
              card&apos;s history with who made it and why.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Staff approve scans as normal but can&apos;t change a card by
              hand. With more people on more counters, that one rule does a
              lot to keep stamps honest.
            </p>
          </section>

          <section className="mb-14 rounded-2xl bg-white p-8 ring-1 ring-stone-200">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">Setting up a group in 10 minutes</h2>
            <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-relaxed text-stone-600">
              <li>Set up your first shop and get its card looking right.</li>
              <li>Open the shop switcher and choose <strong>Add a new shop</strong> for each other location.</li>
              <li>Print each shop&apos;s QR code from its own Shop setup page.</li>
              <li>On the Team page, invite managers with <strong>All shops</strong> and staff with just their shop.</li>
              <li>Check the <strong>All shops</strong> dashboard at the end of the week.</li>
            </ol>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">FAQ</h2>
            <div className="mt-6 space-y-6">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group rounded-xl border border-stone-200 bg-white px-6 py-5">
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-stone-900">
                    {q}
                    <span className="ml-4 text-stone-400 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-stone-500">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900">Running more than one cafe?</h3>
            <p className="mt-2 text-stone-500">
              Start free with your first shop, or{" "}
              <Link href="/contact" className="text-amber-700 underline-offset-2 hover:underline">
                tell us about your group
              </Link>{" "}
              and we&apos;ll size a plan for it.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer border-stone-300 !bg-white px-8 text-base !text-stone-900 hover:!bg-stone-100"
                >
                  See all features
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
