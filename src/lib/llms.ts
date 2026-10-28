// /llms.txt and /llms-full.txt: a plain-text map of the site for AI assistants
// and answer engines (llmstxt.org). Prices and plan details come from the plan
// catalogue so they can't go stale; the page list is curated here.

import { SITE_URL } from "@/lib/site";
import { FREE_STAMPS, formatCents, type PlanCatalog } from "@/lib/plans";
import { pricingFaq } from "@/lib/pricing-faq";
import { LANGUAGE_META } from "@/lib/i18n";

type Link = { title: string; path: string; note?: string };

const PRODUCT: Link[] = [
  { title: "Coffee loyalty card app (home)", path: "/", note: "What Brewstamp is, how it works, and why digital beats paper punch cards." },
  { title: "How it works", path: "/how-it-works", note: "The three-step setup — customise your branded card, print one QR code for the counter, and approve stamps from your phone or tablet." },
  { title: "Coffee rewards app", path: "/coffee-rewards-app", note: "The coffee rewards card with no app to download — scan, stamp, free coffee." },
  { title: "Cafe loyalty app for the counter", path: "/cafe-loyalty-app", note: "Staff approve stamps on any device; owners see every regular." },
  { title: "Features", path: "/features", note: "Full feature list across the Free, Pro, and Business plans." },
  { title: "Pricing", path: "/pricing", note: "Plans compared side by side, with a pricing FAQ." },
  { title: "Corporate perk mode (subsidised staff coffee)", path: "/blog/corporate-coffee-perk", note: "Employer-paid staff coffee at a local cafe — staff scan and enter their work email for a free coffee, gated to the company's email domain and capped per person per day. On the Business plan." },
  { title: "Apple Wallet and Google Wallet cards", path: "/blog/apple-google-wallet-loyalty-card", note: "Customers save the card to their phone's wallet; stamps update automatically. Every plan." },
];

const GUIDES: Link[] = [
  { title: "The best coffee shop loyalty apps, compared", path: "/blog/best-coffee-shop-loyalty-apps" },
  { title: "Coffee Loyalty Card: The Complete Guide for Cafes", path: "/blog/digital-loyalty-cards-for-cafes", note: "How digital loyalty cards work and what to look for." },
  { title: "Coffee shop loyalty cards: paper vs digital", path: "/blog/coffee-shop-loyalty-cards", note: "The case for going digital, the 8-stamp rule, and how to launch." },
  { title: "How many stamps for a free coffee?", path: "/blog/how-many-stamps-for-a-free-coffee", note: "Choosing the right reward threshold (most cafes use 6–10)." },
  { title: "How to set up a QR code loyalty program", path: "/blog/qr-code-loyalty-program", note: "Step-by-step QR loyalty setup for a coffee shop." },
  { title: "Coffee shop loyalty card printing", path: "/blog/coffee-shop-loyalty-card-printing", note: "Why you only print one QR poster instead of stacks of cards." },
  { title: "Why paper loyalty cards don't work anymore", path: "/blog/why-paper-loyalty-cards-dont-work", note: "Lost cards, fraud, and zero data." },
  { title: "Cafe loyalty programs for customers", path: "/blog/cafe-loyalty-programs-for-customers", note: "How the customer experience works." },
  { title: "Multi-language loyalty cards", path: "/blog/multi-language-loyalty-card", note: "One QR code, every customer language." },
  { title: "Loyalty across multiple cafes", path: "/blog/multi-location-cafe-loyalty-program", note: "Every shop under one account, all-shops dashboard, per-shop team access." },
  { title: "Multi-shop and team logins", path: "/blog/multiple-shops-and-team-logins", note: "Running multiple cafes and inviting staff." },
  { title: "Set up your Brewstamp shop in 5 minutes", path: "/blog/set-up-your-brewstamp-shop", note: "Onboarding walkthrough." },
];

const COMPARISONS: Link[] = [
  { title: "Brewstamp vs other loyalty apps", path: "/alternatives", note: "Honest comparisons against the main digital loyalty platforms for cafes." },
  { title: "Brewstamp vs Loopy Loyalty", path: "/alternatives/loopy-loyalty" },
  { title: "Brewstamp vs Stamp Me", path: "/alternatives/stamp-me" },
  { title: "Brewstamp vs PunchPass", path: "/alternatives/punchpass" },
  { title: "Brewstamp vs Square Loyalty", path: "/alternatives/square-loyalty" },
  { title: "Brewstamp vs Loyverse", path: "/alternatives/loyverse" },
  { title: "Brewstamp vs Smile.io", path: "/alternatives/smile-io" },
];

const STORIES: Link[] = [
  { title: "Bennett St Dairy, Bondi", path: "/blog/bennett-st-dairy-bondi", note: "How a Bondi cafe uses Brewstamp." },
  { title: "Thirty7even, Macquarie Park", path: "/blog/thirty-7even-macquarie-park", note: "A specialty coffee shop's loyalty story." },
];

const list = (links: Link[]) =>
  links.map((l) => `- [${l.title}](${SITE_URL}${l.path === "/" ? "/" : l.path})${l.note ? `: ${l.note}` : ""}`).join("\n");

function summary(catalog: PlanCatalog): string {
  const paid = catalog.publicPlans.filter((p) => p.slug !== "free");
  const pro = paid.find((p) => p.slug === "pro");
  const business = paid.find((p) => p.slug === "plus");
  const maxShops = Math.max(...catalog.publicPlans.map((p) => p.shopLimit));
  const monthsFree = Math.max(0, ...paid.map((p) => catalog.monthsFree(p)));
  const languages = Object.values(LANGUAGE_META).map((l) => l.englishName);
  const price = (slug: string) => {
    const p = paid.find((x) => x.slug === slug);
    return p ? formatCents(catalog.priceCents(p, "month")) : "";
  };
  return [
    "Brewstamp is a digital coffee loyalty card and rewards app for cafes. Customers scan a QR code at the counter — no app to download, no signup — to collect stamps and earn a free coffee. The merchant approves each stamp from their phone, so it can't be gamed.",
    `Free for the first ${FREE_STAMPS} stamps;${pro ? ` ${pro.label} is ${price("pro")}/month for unlimited stamps at one shop` : ""}${business ? `, and ${business.label} (${price("plus")}/month) adds unlimited staff logins, up to ${business.shopLimit} shops, CSV customer exports and cross-shop reporting` : ""}. Prices are in US dollars. Annual billing gets ${monthsFree} months free; groups with more than ${maxShops} shops get a custom plan priced per shop (contact hello@brewstamp.app).`,
    `Works on any iPhone or Android in the browser, worldwide, in ${languages.length} customer-facing languages: ${languages.join(", ")}. Cards can also be saved to Apple Wallet and Google Wallet.`,
    "Brewstamp also offers a corporate perk mode (Business plan): a company subsidises its team's coffee at a local cafe — staff get a free coffee by scanning a QR code and entering their work email, capped per person per day, with per-person reports the company can reimburse against.",
  ].join(" ");
}

export function buildLlmsTxt(catalog: PlanCatalog): string {
  return `# Brewstamp

> ${summary(catalog)}

## Product
${list(PRODUCT)}

## Guides
${list(GUIDES)}

## Comparisons
${list(COMPARISONS)}

## Customer stories
${list(STORIES)}

## Optional
- [Full text for AI assistants](${SITE_URL}/llms-full.txt): plans, pricing FAQ and how Brewstamp works, in one file.
`;
}

export function buildLlmsFullTxt(catalog: PlanCatalog): string {
  const plans = catalog.publicPlans
    .map((p) => {
      const price =
        p.slug === "free"
          ? `$0 for the first ${FREE_STAMPS} stamps`
          : `${formatCents(catalog.priceCents(p, "month"))}/month or ${formatCents(catalog.priceCents(p, "year"))}/year (USD)`;
      return `### ${p.label} — ${price}\n${p.tagline}.\n${p.features.map((f) => `- ${f}`).join("\n")}`;
    })
    .join("\n\n");
  const faq = pricingFaq(catalog)
    .map((f) => `### ${f.q}\n${f.a}`)
    .join("\n\n");
  return `# Brewstamp — full reference

> ${summary(catalog)}

Website: ${SITE_URL} · Contact: hello@brewstamp.app · Sign up: ${SITE_URL}/register

## How it works
1. The cafe signs up, names its shop and designs its loyalty card (logo, colours, how many stamps for a reward — most cafes use 6–10).
2. It prints one QR code and puts it on the counter.
3. A customer scans the QR code with their phone camera. The card opens in the browser — no app, no account. They can save it to Apple Wallet or Google Wallet.
4. Each scan sends a stamp request; staff approve it in one tap from a phone, tablet or the dashboard, so stamps can't be faked.
5. When the card is full the customer gets their reward, which staff approve the same way.
6. The owner sees every customer, their visits and rewards, plus dashboards for busy times, new vs returning customers and lapsed regulars.

## Plans
${plans}

### Custom — priced per shop
For groups and chains with more than ${Math.max(...catalog.publicPlans.map((p) => p.shopLimit))} shops: everything in Business, any number of shops under one account, per-shop staff access, help setting up every shop and dedicated support. Contact hello@brewstamp.app.

## Pricing FAQ
${faq}

## More
${list([...PRODUCT, ...GUIDES, ...COMPARISONS, ...STORIES])}
`;
}
