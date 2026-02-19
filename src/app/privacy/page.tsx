import type { Metadata } from "next";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Brewstamp privacy policy — what data we collect and how we use it.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-2xl font-bold text-stone-900">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-600">
          <p>
            Brewstamp respects your privacy. This policy explains what data we
            collect and how we use it.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">What We Collect</h2>
          <p>
            <strong>Merchants:</strong> Email address, name, and shop details
            provided during registration.
          </p>
          <p>
            <strong>Customers:</strong> An anonymous browser cookie to identify
            returning visitors. Optionally, a name and email if voluntarily
            provided.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">How We Use It</h2>
          <p>
            Data is used solely to operate the stamp card service — tracking
            stamps, managing rewards, and displaying customer visit information
            to merchants.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">Data Sharing</h2>
          <p>
            We do not sell or share personal data with third parties. Merchant
            data is only accessible to the merchant account that created it.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">Cookies</h2>
          <p>
            We use a single persistent cookie to identify returning customers
            across visits. This cookie contains a random identifier and no
            personal information.
          </p>
          <h2 className="pt-2 text-base font-semibold text-stone-900">Contact</h2>
          <p>
            Privacy questions? Email us at hello@brewstamp.app.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
