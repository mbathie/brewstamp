import Link from "next/link";
import { FREE_STAMPS, formatCents, type PlanCatalog } from "@/lib/plans";

// The general FAQ: shown on the homepage and on /faq, each with matching
// FAQPage JSON-LD. Every item carries a plain-text answer for the JSON-LD
// (which must match what's on the page) and, where it has a link, a rich one.

export interface FaqItem {
  q: string;
  text: string;
  rich?: React.ReactNode;
}

// The price answer comes from the plan catalogue so it can't drift.
function costAnswer(catalog: PlanCatalog): string {
  const pro = catalog.bySlug("pro");
  const business = catalog.publicPlans.find((p) => p.slug === "plus");
  const proLine = pro
    ? ` After that, Pro is ${formatCents(catalog.priceCents(pro, "month"))}/month for unlimited stamps (or ${formatCents(catalog.priceCents(pro, "year"))}/year, ${catalog.monthsFree(pro)} months free)`
    : "";
  const bizLine = business
    ? `, and ${business.label} is ${formatCents(catalog.priceCents(business, "month"))}/month for teams and up to ${business.shopLimit} shops`
    : "";
  return `Brewstamp is free for your first ${FREE_STAMPS} stamps — enough to test if a loyalty program works for your shop.${proLine}${bizLine}.`;
}

export function faqItems(catalog: PlanCatalog): FaqItem[] {
  return [
    {
      q: "What's the best loyalty program for a coffee shop?",
      text: "A digital loyalty card with a free-coffee-after-8-stamps reward beats paper punch cards on every measurable front: lower fraud, no lost cards, real customer data, and zero ongoing printing cost. See the full guide to coffee shop loyalty cards for what rewards work, the 8-stamp rule, and how to launch one in under 2 minutes.",
      rich: (
        <>
          A digital loyalty card with a free-coffee-after-8-stamps
          reward beats paper punch cards on every measurable front:
          lower fraud, no lost cards, real customer data, and zero
          ongoing printing cost.{" "}
          <Link
            href="/blog/coffee-shop-loyalty-cards"
            className="font-medium text-amber-700 underline hover:text-amber-800"
          >
            See the full guide to coffee shop loyalty cards
          </Link>{" "}
          for what rewards work, the 8-stamp rule, and how to launch
          one in under 2 minutes.
        </>
      ),
    },
    {
      q: "What is a digital coffee loyalty card?",
      text: "A digital coffee loyalty card replaces paper stamp cards with a phone-based version. Customers scan a QR code at your counter to collect stamps and earn free drinks — no app download required.",
    },
    {
      q: "How does a QR code coffee rewards program work?",
      text: "You place a QR code at your counter. Customers scan it with their phone camera, you approve the stamp from your dashboard, and the stamp appears on their digital card instantly. After enough stamps, they earn a free drink.",
    },
    {
      q: "Do I need a POS system to use Brewstamp?",
      text: "No. All you need is a phone or tablet behind the counter, logged in to your Brewstamp shop. Print the QR code from your shop settings and put it where customers order; they scan it, and you approve the stamp on your device. It works alongside a cash register or any POS — there's nothing to integrate.",
    },
    {
      q: "Do customers need to download an app?",
      text: "No. Brewstamp works entirely in the phone's browser. Customers just scan the QR code — no app to download, no account to create. It works on any iPhone or Android phone.",
    },
    {
      q: "Can customers add the card to Apple Wallet or Google Wallet?",
      text: "Yes — on every plan, customers can save their loyalty card to Apple Wallet or Google Wallet for lock-screen access, and it updates automatically each time they earn a stamp. There's still no app to download, and the browser card works for everyone either way.",
    },
    {
      q: "How much does a digital loyalty card for cafes cost?",
      text: costAnswer(catalog),
    },
    {
      q: "How long does it take to set up a coffee shop loyalty program?",
      text: "Less than 2 minutes. Create your shop, customise your card, print your QR code, and start stamping. No technical knowledge required.",
    },
  ];
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map(({ q, text }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  };
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-6">
      {items.map(({ q, text, rich }) => (
        <details
          key={q}
          className="group rounded-xl border border-stone-200 bg-stone-50 px-6 py-5"
        >
          <summary className="flex cursor-pointer items-center justify-between font-semibold text-stone-900">
            {q}
            <span className="ml-4 text-stone-400 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            {rich ?? text}
          </p>
        </details>
      ))}
    </div>
  );
}
