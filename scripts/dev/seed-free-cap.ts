// Local-only: two free-trial shops at their stamp allowance, to eyeball the
// "stamping paused" experience for the owner and the customer.
//
//   npx tsx scripts/dev/seed-free-cap.ts
//
// Idempotent — re-running resets both accounts to the state below. Refuses to
// run against anything but a localhost database.
//
// Test logins (local dev only, never real accounts):
//   New tier (50):        freecap50@brewstamp.test   / freecap-test-50
//   Grandfathered (100):  freecap100@brewstamp.test  / freecap-test-100
//
// What each gets: a shop with no subscription, stamps just over its allowance
// (52 of 50 / 101 of 100) spread across a few customers, and one pending stamp
// request that lasts a week, so the approval dialog opens straight into the
// "Free trial limit reached" state. Customer page: /s/FREECAP5 and /s/FREECAPX.
import "../../src/lib/load-env";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Customer, Shop, ShopMembership, StampCard, StampRequest, Subscription, User } from "../../src/models";

const ACCOUNTS = [
  { email: "freecap50@brewstamp.test", password: "freecap-test-50", shop: "Capped Café (50)", code: "FREECAP5", tier: "free_50", stamps: [12, 11, 10, 10, 9] }, // 52
  { email: "freecap100@brewstamp.test", password: "freecap-test-100", shop: "Capped Café (100)", code: "FREECAPX", tier: "free_100", stamps: [25, 22, 20, 18, 16] }, // 101
] as const;

async function main() {
  const uri = process.env.MONGODB_URI || "";
  if (!/localhost|127\.0\.0\.1/.test(uri)) throw new Error("Refusing to seed: MONGODB_URI is not a localhost database.");
  await mongoose.connect(uri);

  for (const a of ACCOUNTS) {
    const hash = await bcrypt.hash(a.password, 10);
    const user = await User.findOneAndUpdate(
      { email: a.email },
      { $set: { email: a.email, name: a.shop.replace(/ \(.*/, "") + " Owner", hash, emailVerified: new Date(), phone: "0400000000" } },
      { upsert: true, new: true },
    );
    const shop = await Shop.findOneAndUpdate(
      { code: a.code },
      { $set: { name: a.shop, owner: user._id, code: a.code, freeTier: a.tier, stampThreshold: 8, upgradeNudgeSent: true } },
      { upsert: true, new: true },
    );
    await User.updateOne({ _id: user._id }, { $set: { shopId: shop._id } });
    await ShopMembership.updateOne(
      { user: user._id, shop: shop._id },
      { $set: { role: "owner", acceptedAt: new Date() } },
      { upsert: true },
    );
    // No paid plan: the free-trial cap applies.
    await Subscription.deleteMany({ shop: shop._id });

    // Reset the shop's cards and requests, then seed customers.
    await StampCard.deleteMany({ shop: shop._id });
    await StampRequest.deleteMany({ shop: shop._id });
    const customers = [];
    for (let i = 0; i < a.stamps.length; i++) {
      const cookieId = `seed-${a.code.toLowerCase()}-${i + 1}`;
      const c = await Customer.findOneAndUpdate(
        { cookieId },
        { $set: { cookieId, name: ["Ava", "Ben", "Chloe", "Dev", "Ella"][i] } },
        { upsert: true, new: true },
      );
      customers.push(c);
      const earned = a.stamps[i];
      await StampCard.create({ shop: shop._id, customer: c._id, stamps: earned % 8, totalEarned: earned, freeRedeemed: Math.floor(earned / 8) });
    }
    // One pending request that outlives the default 10-minute expiry.
    await StampRequest.create({ shop: shop._id, customer: customers[0]._id, expiresAt: new Date(Date.now() + 7 * 86_400_000) });

    const total = a.stamps.reduce((t, n) => t + n, 0);
    console.log(`${a.shop}: ${a.email} · ${total} stamps on ${a.tier} · customer page /s/${a.code}`);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
