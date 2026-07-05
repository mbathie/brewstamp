import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Loyalty Guides for Cafe Owners",
  description:
    "Guides, tips, and insights for cafe owners on loyalty programs, customer retention, and growing your coffee shop.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Brewstamp Blog — Loyalty guides for cafes",
    description:
      "Guides, tips, and insights for cafe owners on loyalty programs, customer retention, and growing your coffee shop.",
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
    title: "Brewstamp Blog — Loyalty guides for cafes",
    description:
      "Guides, tips, and insights for cafe owners on loyalty programs, customer retention, and growing your coffee shop.",
    images: [
      "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop",
    ],
  },
};

const posts = [
  {
    slug: "apple-google-wallet-loyalty-card",
    title:
      "Your Coffee Loyalty Card, Now in Apple Wallet & Google Wallet",
    description:
      "Brewstamp loyalty cards now save to Apple Wallet and Google Wallet — lock-screen access, stamps that update automatically, and still no app to download. On every plan, including Free.",
    tag: "Product update",
    image: "/blog/wallet-passes-hero.svg",
    imageAlt:
      "A Brewstamp loyalty card with Add to Apple Wallet and Add to Google Wallet buttons",
    publishedAt: "2026-06-22",
    publishedAtDisplay: "22 June 2026",
  },
  {
    slug: "corporate-coffee-perk",
    title:
      "Subsidised Staff Coffee, Run From One QR Code: Corporate Perk Mode",
    description:
      "Give your team a coffee perk without vouchers or spreadsheets. Perk mode turns a cafe QR code into an employer-subsidised staff coffee benefit — gated to your work email, capped per person per day, with reports for reimbursement.",
    tag: "Product update",
    image:
      "https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=600&h=400&q=70&auto=format&fit=crop",
    imageAlt: "A flat white coffee served on a wooden tray",
    publishedAt: "2026-06-13",
    publishedAtDisplay: "13 June 2026",
  },
  {
    slug: "multiple-shops-and-team-logins",
    title:
      "Multi-Shop, Team Logins, and a New Pricing Lineup",
    description:
      "Brewstamp now runs up to 10 cafes under one account, lets you invite managers and staff to accept stamps at the counter, and ships a fresh four-plan lineup — Free, Pro, Plus, and Max.",
    tag: "Product update",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&q=70&auto=format&fit=crop",
    imageAlt: "Cafe interior with bar and stools",
    publishedAt: "2026-05-16",
    publishedAtDisplay: "16 May 2026",
  },
  {
    slug: "coffee-shop-loyalty-card-printing",
    title:
      "Coffee Shop Loyalty Card Printing: Print One QR Code, Skip the Stack of Paper Cards",
    description:
      "How to print a coffee shop loyalty card the modern way — one A4 sheet with a QR code, not boxes of punch cards. Free PDF, prints on any printer, set up in 2 minutes.",
    tag: "Guide",
    image:
      "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Cafe counter with a printed QR loyalty card",
    publishedAt: "2026-05-14",
    publishedAtDisplay: "14 May 2026",
  },
  {
    slug: "how-many-stamps-for-a-free-coffee",
    title:
      "How Many Stamps for a Free Coffee? Loyalty Card Thresholds Explained",
    description:
      "Most cafes set their loyalty card between 6 and 10 stamps. Here's why the number matters, what the typical rewards look like, and what to watch out for.",
    tag: "For customers",
    image:
      "https://images.unsplash.com/photo-1726666339581-07d2c51baeeb?w=600&h=400&q=70&auto=format&fit=crop",
    imageAlt: "Cappuccino served on a wooden tray with a loyalty card",
    publishedAt: "2026-05-13",
    publishedAtDisplay: "13 May 2026",
  },
  {
    slug: "cafe-loyalty-programs-for-customers",
    title:
      "Does This Cafe Have a Loyalty Program? Yes — Here's How to Find It and Earn Free Coffee",
    description:
      "Look for a QR code at the counter, scan it with your phone (no app needed), and start collecting stamps toward a free drink. Here's exactly how it works.",
    tag: "For customers",
    image:
      "https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Customer scanning a QR code at a cafe counter",
    publishedAt: "2026-05-11",
    publishedAtDisplay: "11 May 2026",
  },
  {
    slug: "multi-language-loyalty-card",
    title: "Multi-Language Loyalty Cards: 14 Languages, Same QR Code",
    description:
      "Brewstamp now translates your customer-facing loyalty card and printable QR PDF into 14 languages — pick the one that matches your customers.",
    tag: "Product update",
    image: "/world-map.svg",
    imageAlt: "World map illustrating Brewstamp's 14 supported languages",
    imageBg: "stone-100",
    imageContain: true,
    publishedAt: "2026-05-10",
    publishedAtDisplay: "10 May 2026",
  },
  {
    slug: "set-up-your-brewstamp-shop",
    title: "How to Set Up Your Brewstamp Shop in 5 Minutes",
    description:
      "Step-by-step setup walkthrough for new Brewstamp shops — print the QR code, run a test stamp, award your first real one.",
    tag: "How-to",
    image:
      "https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Customer scanning a QR code at a cafe counter",
    publishedAt: "2026-05-10",
    publishedAtDisplay: "10 May 2026",
  },
  {
    slug: "thirty-7even-macquarie-park",
    title:
      "Thirty 7even in Macquarie Park: 10 Weeks on Brewstamp",
    description:
      "How Asian-fusion cafe Thirty 7even runs its digital coffee loyalty card on Brewstamp — 180+ regulars, 600+ stamps, and a fully branded card from day one.",
    tag: "Customer story",
    image:
      "/blog/thirty-7even-interior.jpg",
    imageAlt: "Thirty 7even cafe interior, Macquarie Park",
    publishedAt: "2026-05-07",
    publishedAtDisplay: "7 May 2026",
  },
  {
    slug: "bennett-st-dairy-bondi",
    title:
      "Bennett St Dairy in Bondi: How a Real Cafe Runs Its Coffee Loyalty Card",
    description:
      "How Bondi cafe Bennett St Dairy runs a digital coffee loyalty card on Brewstamp — QR code at the counter, buy 7 get 1 free, dozens of regulars enrolled.",
    tag: "Customer story",
    image:
      "https://images.pexels.com/photos/16323069/pexels-photo-16323069.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Bondi Beach in Sydney, Australia",
    publishedAt: "2026-05-06",
    publishedAtDisplay: "6 May 2026",
  },
  {
    slug: "coffee-shop-loyalty-cards",
    title:
      "Coffee Shop Loyalty Cards: How They Work and the Best Rewards to Offer",
    description:
      "How a coffee shop loyalty card works, the best coffee shop loyalty card rewards to offer, and why digital is replacing the paper punch card.",
    tag: "Guide",
    image:
      "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Barista handing a coffee cup to a customer",
    publishedAt: "2026-05-05",
    publishedAtDisplay: "5 May 2026",
  },
  {
    slug: "digital-loyalty-cards-for-cafes",
    title: "Coffee Loyalty Card: The Complete Guide for Cafes",
    description:
      "Everything cafe owners need to know about the digital coffee loyalty card. How it works, what it costs, and why it outperforms paper stamp cards.",
    tag: "Guide",
    image:
      "https://images.pexels.com/photos/30226644/pexels-photo-30226644.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Barista preparing coffee in a modern cafe",
    publishedAt: "2026-02-27",
    publishedAtDisplay: "27 February 2026",
  },
  {
    slug: "qr-code-loyalty-program",
    title: "How to Set Up a QR Code Loyalty Program for Your Coffee Shop",
    description:
      "Step-by-step guide to launching a QR code loyalty program at your cafe. No app needed, free to start, works on any phone.",
    tag: "How-to",
    image:
      "https://images.pexels.com/photos/16345589/pexels-photo-16345589.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Customer scanning a QR code with a smartphone",
    publishedAt: "2026-02-27",
    publishedAtDisplay: "27 February 2026",
  },
  {
    slug: "why-paper-loyalty-cards-dont-work",
    title: "Why Paper Loyalty Cards Don't Work Anymore",
    description:
      "Paper stamp cards lose customers, generate zero data, and are easy to fake. Here's why cafes are switching to digital.",
    tag: "Opinion",
    image:
      "https://images.pexels.com/photos/6632853/pexels-photo-6632853.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Crumpled paper balls on a flat surface",
    publishedAt: "2026-02-27",
    publishedAtDisplay: "27 February 2026",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  url: "https://brewstamp.app/blog",
  name: "Brewstamp Blog",
  description:
    "Guides, tips, and insights for cafe owners on loyalty programs, customer retention, and growing your coffee shop.",
  publisher: {
    "@type": "Organization",
    name: "Brewstamp",
    url: "https://brewstamp.app",
  },
  blogPost: posts.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: `https://brewstamp.app/blog/${post.slug}`,
    image: post.image,
    datePublished: post.publishedAt,
  })),
};

export default function BlogIndex() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
          Blog
        </h1>
        <p className="mt-3 text-lg text-stone-500">
          Guides and insights for cafe owners on loyalty, retention, and
          growing your shop.
        </p>
        <div className="mt-10 space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow hover:shadow-md sm:flex-row"
            >
              <div className="relative w-full shrink-0 overflow-hidden bg-stone-100 sm:w-56 md:w-64">
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  loading="lazy"
                  className={`h-48 w-full transition-transform duration-300 group-hover:scale-105 sm:h-full ${
                    post.imageContain
                      ? "object-contain p-4 opacity-70"
                      : "object-cover"
                  }`}
                />
              </div>
              <div className="flex-1 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  {post.tag}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-snug text-stone-900">
                  {post.title}
                </h2>
                <p className="mt-2 text-stone-500">{post.description}</p>
                <p className="mt-3 text-xs text-stone-400">
                  Published{" "}
                  <time dateTime={post.publishedAt}>
                    {post.publishedAtDisplay}
                  </time>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
