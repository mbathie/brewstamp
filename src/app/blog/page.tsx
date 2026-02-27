import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Blog — Brewstamp",
  description:
    "Guides, tips, and insights for cafe owners on loyalty programs, customer retention, and growing your coffee shop.",
};

const posts = [
  {
    slug: "digital-loyalty-cards-for-cafes",
    title: "Digital Loyalty Cards for Cafes: The Complete Guide",
    description:
      "Everything cafe owners need to know about digital loyalty cards. How they work, what they cost, and why they outperform paper stamp cards.",
    tag: "Guide",
  },
  {
    slug: "qr-code-loyalty-program",
    title: "How to Set Up a QR Code Loyalty Program for Your Coffee Shop",
    description:
      "Step-by-step guide to launching a QR code loyalty program at your cafe. No app needed, free to start, works on any phone.",
    tag: "How-to",
  },
  {
    slug: "why-paper-loyalty-cards-dont-work",
    title: "Why Paper Loyalty Cards Don't Work Anymore",
    description:
      "Paper stamp cards lose customers, generate zero data, and are easy to fake. Here's why cafes are switching to digital.",
    tag: "Opinion",
  },
];

export default function BlogIndex() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
          Blog
        </h1>
        <p className="mt-3 text-lg text-stone-500">
          Guides and insights for cafe owners on loyalty, retention, and
          growing your shop.
        </p>
        <div className="mt-10 space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                {post.tag}
              </p>
              <h2 className="mt-2 text-xl font-bold text-stone-900">
                {post.title}
              </h2>
              <p className="mt-2 text-stone-500">{post.description}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
