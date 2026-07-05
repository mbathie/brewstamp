import { notFound } from "next/navigation";

// Dev-only internal competitive report. Double-guarded (layout also gates the
// /internal segment) so it can never serve in production.
export const dynamic = "force-dynamic";

const PRICING: Array<{
  name: string;
  free: string;
  cheapest: string;
  top: string;
  model: string;
}> = [
  { name: "Loyverse", free: "✅ loyalty free", cheapest: "Free", top: "add-ons $7–25", model: "Points · needs Loyverse POS" },
  { name: "Brewstamp", free: "✅ 100 stamps", cheapest: "$7 AUD (~$4.50)", top: "$29 AUD (~$19)", model: "QR / browser card" },
  { name: "TurboPush", free: "❌ trial", cheapest: "$5.99 USD", top: "$58.99 USD", model: "Apple/Google Wallet" },
  { name: "FaveCard", free: "✅ 1 card", cheapest: "$19 USD", top: "Enterprise", model: "Apple/Google Wallet" },
  { name: "LoyaltyPal", free: "❌", cheapest: "£19 (~$24)", top: "£79 (~$100)", model: "Apple/Google Wallet" },
  { name: "Loopy Loyalty", free: "❌", cheapest: "$25 USD", top: "$95 USD", model: "Apple/Google Wallet" },
  { name: "Flex Rewards", free: "✅ to 50 cust.", cheapest: "$36 USD", top: "+ add-ons", model: "QR (no app)" },
  { name: "Square Loyalty", free: "❌", cheapest: "~$45/mo / location", top: "scales / location", model: "Points · needs Square POS" },
  { name: "Stamp Me", free: "❌ trial", cheapest: "$49 USD", top: "$199 USD", model: "Customer app required" },
  { name: "LoyaltyPass", free: "❌", cheapest: "$49–99 USD", top: "$147 USD", model: "Apple/Google Wallet" },
  { name: "Boomerangme", free: "❌", cheapest: "$199 USD", top: "$299+ USD", model: "Wallet · agency/white-label" },
];

const FEATURES = {
  cols: [
    "Brew", "Loopy", "StampMe", "Fave", "LoyalPal", "LoyalPass", "Turbo", "Boom", "Flex", "Square", "Loyverse",
  ],
  rows: [
    ["No customer app", "✅","✅","❌","✅","✅","✅","✅","✅","✅","✅","✅"],
    ["Apple/Google Wallet", "❌","✅","❌","✅","✅","✅","✅","✅","❌","❌","❌"],
    ["Push notifications", "❌","✅","✅","✅","✅","✅","✅","✅","✅","SMS","❌"],
    ["Geofenced push", "❌","✅","❌","❌","✅","✅","❌","✅","❌","❌","❌"],
    ["Stamp cards", "✅","✅","✅","✅","✅","✅","✅","✅","✅","❌","❌"],
    ["Points-based", "❌","❌","❌","❌","✅","✅","✅","✅","❌","✅","✅"],
    ["Multi-location", "✅","✅","~","❌","✅","✅","❌","✅","✅","✅","✅"],
    ["Staff logins", "✅","✅","✅","✅","✅","✅","?","✅","✅","add-on","add-on"],
    ["CSV export", "✅","top","✅","✅","✅","?","❌","✅","?","✅","✅"],
    ["POS integration", "❌","Zapier","soon","❌","✅","ent.","❌","✅","❌","native","native"],
    ["Public API", "❌","✅","❌","❌","❌","ent.","❌","✅","❌","✅","✅"],
    ["White-label", "❌","❌","❌","❌","❌","ent.","❌","✅","❌","❌","❌"],
    ["Real-time approval", "✅","❌","✅","❌","❌","❌","❌","❌","❌","—","—"],
    ["Corporate perk mode", "✅","❌","❌","❌","❌","❌","❌","❌","❌","❌","❌"],
  ],
};

const GAPS = [
  ["1. No Apple/Google Wallet pass", "The #1 gap. 6 of 10 rivals put the card in the native wallet; Brewstamp uses a browser/cookie card with no lock-screen presence (and it can be lost if cookies clear). The modern standard."],
  ["2. No push notifications", "Wallet rivals push “you’re 1 stamp away” to the lock screen — the core re-engagement loop. Brewstamp has email drip only. Push is unlocked BY wallet passes, so #1 and #2 are one project."],
  ["3. No points-based mode", "Stamp + perk only. Half the field also offers points/tiers/cashback (LoyaltyPal has 8 card types)."],
  ["4. No POS integration", "LoyaltyPal, Boomerangme, Square, Loyverse auto-earn at the till. Brewstamp is manual QR + approval (a fraud strength, but manual)."],
  ["5. No API / white-label", "Lower priority for direct SMB, but white-label is how Boomerangme monetises agencies — a channel Brewstamp can’t serve."],
];

const WINS = [
  ["Price", "Cheapest paid plan in the field (Pro ~$4.50 USD undercuts even TurboPush) + a real free tier."],
  ["Zero-friction onboarding", "Scan → card opens in browser. No “add to wallet” step, no install. Lowest-friction first scan of anyone."],
  ["Real-time barista approval", "Anti-fraud; most wallet apps let customers self-stamp."],
  ["Corporate perk mode", "Subsidised staff coffee — a unique angle nobody else has."],
  ["14 languages", "Broader international reach than most."],
];

function Cell({ v }: { v: string }) {
  const color =
    v === "✅" ? "text-emerald-600" : v === "❌" ? "text-red-400" : "text-stone-500";
  return <td className={`border-b border-stone-200 px-2 py-1.5 text-center text-xs ${color}`}>{v}</td>;
}

export default function LoyaltyCompetitorsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <article className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Internal · dev-only
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Loyalty competitor comparison
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Pricing observed 2026-06-22. Brewstamp prices are AUD; competitors
          mostly USD (≈0.65 conversion shown). Verify before quoting publicly —
          several rivals run promos and Square hides its standalone price.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Pricing — cheapest → dearest</h2>
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Free tier</th>
                <th className="px-3 py-2">Cheapest paid</th>
                <th className="px-3 py-2">Top tier</th>
                <th className="px-3 py-2">Model</th>
              </tr>
            </thead>
            <tbody>
              {PRICING.map((p) => (
                <tr key={p.name} className={p.name === "Brewstamp" ? "bg-amber-50 font-medium" : ""}>
                  <td className="border-t border-stone-200 px-3 py-2">{p.name}</td>
                  <td className="border-t border-stone-200 px-3 py-2">{p.free}</td>
                  <td className="border-t border-stone-200 px-3 py-2">{p.cheapest}</td>
                  <td className="border-t border-stone-200 px-3 py-2">{p.top}</td>
                  <td className="border-t border-stone-200 px-3 py-2 text-stone-500">{p.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-stone-600">
          <strong>Takeaway:</strong> Brewstamp is the cheapest paid plan in the
          field and one of only three with a genuine free tier. You win on price.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Feature matrix</h2>
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
                <th className="px-2 py-2 text-left">Feature</th>
                {FEATURES.cols.map((c) => (
                  <th key={c} className="px-2 py-2 text-center">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.rows.map((row) => (
                <tr key={row[0]} className="odd:bg-white even:bg-stone-50/50">
                  <td className="border-b border-stone-200 px-2 py-1.5 text-xs font-medium">{row[0]}</td>
                  {row.slice(1).map((v, i) => (
                    <Cell key={i} v={v} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-semibold text-red-700">Gaps (ranked)</h2>
          <ul className="space-y-3">
            {GAPS.map(([t, d]) => (
              <li key={t} className="rounded-lg border border-stone-200 bg-white p-3">
                <p className="text-sm font-semibold">{t}</p>
                <p className="mt-1 text-sm text-stone-600">{d}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold text-emerald-700">Where Brewstamp wins</h2>
          <ul className="space-y-3">
            {WINS.map(([t, d]) => (
              <li key={t} className="rounded-lg border border-stone-200 bg-white p-3">
                <p className="text-sm font-semibold">{t}</p>
                <p className="mt-1 text-sm text-stone-600">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold">Strategic read</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          You compete on <strong>price + simplicity</strong> and win there. The
          glaring product gap is <strong>Apple/Google Wallet passes + push</strong> —
          table stakes for almost every rival and the re-engagement engine
          Brewstamp lacks. Crucially, wallet passes do <strong>not</strong> require a
          native app: they&rsquo;re server-generated signed passes delivered via an
          &ldquo;Add to Wallet&rdquo; link into the phone&rsquo;s pre-installed wallet.
          If you build one thing from this report, that&rsquo;s it.
        </p>
      </section>
    </article>
  );
}
