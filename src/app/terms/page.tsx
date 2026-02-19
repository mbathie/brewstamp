import type { Metadata } from "next";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Brewstamp terms of service for merchants and customers.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-2xl font-bold text-stone-900">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-600">
          <p>
            By using Brewstamp you agree to these terms. Brewstamp provides a
            digital loyalty stamp card service for coffee shops and their
            customers.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">Use of the Service</h2>
          <p>
            You may use Brewstamp to manage digital stamp cards for your
            business. You are responsible for maintaining the security of your
            account credentials.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">Customer Data</h2>
          <p>
            Merchants are responsible for how they use customer data collected
            through Brewstamp. Customer information should be handled in
            accordance with applicable privacy laws.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">Availability</h2>
          <p>
            We aim to keep Brewstamp available at all times but do not guarantee
            uninterrupted access. We may update, modify, or discontinue features
            at any time.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">Contact</h2>
          <p>
            Questions about these terms? Reach out at hello@brewstamp.app.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
