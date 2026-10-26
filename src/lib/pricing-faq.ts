import { FREE_STAMPS, formatCents, type PlanCatalog, type PlanConfig } from "@/lib/plans";

// Pricing questions people (and AI assistants) ask, answered from the
// catalogue so the figures can't drift from the plan cards. The same list
// renders on the page and as FAQPage JSON-LD.
export function pricingFaq(catalog: PlanCatalog): { q: string; a: string }[] {
  const paid = catalog.publicPlans.filter((p) => p.slug !== "free");
  const price = (p: PlanConfig, i: "month" | "year") => formatCents(catalog.priceCents(p, i));
  const maxShops = Math.max(...catalog.publicPlans.map((p) => p.shopLimit));
  const monthsFree = Math.max(0, ...paid.map((p) => catalog.monthsFree(p)));
  return [
    {
      q: "Is Brewstamp free?",
      a: `Yes. The Free plan includes your first ${FREE_STAMPS} stamps with QR check-ins, real-time approvals and Apple and Google Wallet passes, with no credit card. After that, ${paid
        .map((p) => `${p.label} is ${price(p, "month")} a month`)
        .join(" and ")} (US dollars).`,
    },
    {
      q: "What's the difference between the paid plans?",
      a: paid.map((p) => `${p.label} (${price(p, "month")}/month): ${p.features.slice(0, 4).join(", ")}.`).join(" "),
    },
    {
      q: "Is there a discount for paying yearly?",
      a: `Yes — annual billing gets ${monthsFree} months free: ${paid
        .map((p) => `${p.label} is ${price(p, "year")} a year`)
        .join(", ")}.`,
    },
    {
      q: `How much is it for more than ${maxShops} shops?`,
      a: `Groups and chains get a custom plan priced per shop, with every Business feature, help setting up each shop and dedicated support. Contact hello@brewstamp.app or use the contact form.`,
    },
    {
      q: "Is there a contract or setup fee?",
      a: "No. There are no setup fees or lock-in contracts; you can change plan or cancel anytime from the billing page, and unused time is credited when you switch.",
    },
    {
      q: "Do my customers have to pay or download an app?",
      a: "No. Customers scan your QR code in their phone's browser and collect stamps for free — no app and no signup. Brewstamp is paid for by the cafe.",
    },
  ];
}
