import Link from "next/link";
import { Coffee } from "lucide-react";
import Footer from "@/components/footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600">
              <Coffee className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-[family-name:var(--font-logo)] text-lg tracking-wide text-stone-900">Brewstamp</span>
          </Link>
        </div>
      </header>
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
