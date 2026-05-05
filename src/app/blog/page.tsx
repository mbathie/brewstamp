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
    slug: "coffee-shop-loyalty-cards",
    title:
      "Coffee Shop Loyalty Cards: How They Work and the Best Rewards to Offer",
    description:
      "How a coffee shop loyalty card works, the best coffee shop loyalty card rewards to offer, and why digital is replacing the paper punch card.",
    tag: "Guide",
    image:
      "https://images.pexels.com/photos/6829507/pexels-photo-6829507.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    imageAlt: "Barista handing a coffee cup to a customer",
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
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-full"
                />
              </div>
              <div className="flex-1 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                  {post.tag}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-snug text-stone-900">
                  {post.title}
                </h2>
                <p className="mt-2 text-stone-500">{post.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
