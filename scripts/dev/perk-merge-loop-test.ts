// Reproduces Mickey's loop: a repeat verifier whose browser does NOT apply the
// cookie swap from the confirm response. Before the fix the reload minted a
// fresh identity (email prompt again); after it, the stale cookie resolves to
// the canonical verified row.
import "../../src/lib/load-env";
import mongoose from "mongoose";
import { Customer, Shop, StampCard } from "../../src/models";
import { generatePerkCode, hashPerkCode } from "../../src/lib/perk-verify";
(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const shop = await Shop.findOne({ code: "XXVCEH7Y" });
  const email = "loop-test@miovision.com";
  await Customer.deleteMany({ email });
  await Customer.deleteMany({ cookieId: /^loop-test-/ });
  // canonical: verified earlier, has history at the shop
  const canonical = await Customer.create({ cookieId: "loop-test-A", email, emailVerified: true, emailVerifiedAt: new Date(Date.now() - 86400_000), perkVerifications: 1, name: "Loop Tester" });
  await StampCard.deleteMany({ customer: canonical._id });
  await StampCard.create({ shop: shop!._id, customer: canonical._id, stamps: 0, totalEarned: 0 });
  // throwaway: this visit, new cookie, code pending
  const code = generatePerkCode();
  const throwaway = await Customer.create({ cookieId: "loop-test-B", email, emailVerified: false, emailVerifyCodeHash: hashPerkCode(code), emailVerifyExpires: new Date(Date.now() + 600_000), emailVerifyAttempts: 0 });
  await StampCard.create({ shop: shop!._id, customer: throwaway._id, stamps: 0, totalEarned: 0 });

  // 1. confirm the code (as the client does)
  const res = await fetch("http://localhost:3000/api/perk/verify/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: String(throwaway._id), code, shopId: String(shop!._id) }) });
  const body = await res.json();
  console.log("confirm →", res.status, body, "| Set-Cookie present:", !!res.headers.get("set-cookie"));

  // 2. reload WITHOUT the swapped cookie — the failing browser's behaviour
  const before = await Customer.countDocuments({});
  const page = await fetch(`http://localhost:3000/s/${shop!.code}`, { headers: { Cookie: "brewstamp_id=loop-test-B" } });
  const html = await page.text();
  const after = await Customer.countDocuments({});
  const resolvesToCanonical = html.includes(String(canonical._id));
  const showsEmailPrompt = /Enter your work email|work email/i.test(html) && !html.includes("Loop Tester");
  console.log("reload with stale cookie → page", page.status, "| resolves to canonical:", resolvesToCanonical, "| new customer rows created:", after - before, "| looks like email prompt:", showsEmailPrompt);
  const tw = await Customer.findById(throwaway._id);
  console.log("throwaway row:", tw ? `kept, mergedInto=${tw.mergedInto}` : "DELETED");

  // cleanup
  await StampCard.deleteMany({ customer: { $in: [canonical._id, throwaway._id] } });
  await Customer.deleteMany({ _id: { $in: [canonical._id, throwaway._id] } });
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
