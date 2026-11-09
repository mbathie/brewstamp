import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { faqItems, faqJsonLd, FaqList } from "@/components/faq";
import { getPlanCatalog } from "@/lib/plan-catalog";

// The price answer reads the plan catalogue; refresh every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ — Coffee Loyalty Card Questions",
  description:
    "Answers to common questions about Brewstamp: how the QR code loyalty card works, whether you need a POS system or an app, Apple and Google Wallet, pricing and setup.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    url: "/faq",
    title: "Brewstamp FAQ — Coffee Loyalty Card Questions",
    description:
      "How the QR code loyalty card works, whether you need a POS or an app, wallet passes, pricing and setup.",
  },
};

export default async function FaqPage() {
  const faq = faqItems(await getPlanCatalog());
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", ...faqJsonLd(faq) }),
        }}
      />
      <PublicHeader />

      <main className="flex-1 bg-white pt-20 pb-24 sm:pt-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              FAQ
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Frequently asked questions
            </h1>
          </div>
          <div className="mt-12">
            <FaqList items={faq} />
          </div>
          <div className="mt-12 text-center text-sm text-stone-500">
            More on plans and billing in the{" "}
            <Link href="/pricing#faq" className="font-medium text-amber-700 underline hover:text-amber-800">
              pricing FAQ
            </Link>
            . Still stuck?{" "}
            <Link href="/contact" className="font-medium text-amber-700 underline hover:text-amber-800">
              Ask us
            </Link>
            .
          </div>
          <div className="mt-10 text-center">
            <Link href="/register">
              <Button size="lg" className="cursor-pointer bg-amber-700 px-10 text-base hover:bg-amber-800">
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
