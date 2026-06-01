// Seed a multi-shop test account so the Phase-1 picker, switcher, and
// aggregate dashboard can be exercised against realistic data without going
// through the full register → setup → activity flow.
//
//   Account:    mbathie+roast@gmail.com  /  testtest
//   Shops:      two owned shops, each pre-populated with customers, stamp
//               cards, and approved stamp-request history.
//   "Plan":     the Plus tier doesn't exist as a Stripe price yet
//               (lands in Phase 3). For now we mint a Subscription row
//               with status='active' so the dashboard usage gauge reflects
//               "on a paid plan" — the user-facing tier label is cosmetic.
//
// Usage (DRY RUN):
//   MONGODB_URI="<uri>" npx ts-node \
//     --project tsconfig.server.json \
//     scripts/seed-roast-account.ts
//
// Usage (REAL WRITE):
//   MONGODB_URI="<uri>" npx ts-node \
//     --project tsconfig.server.json \
//     scripts/seed-roast-account.ts --confirm
//
// Safe to re-run: if the user already exists, the password is reset and
// any pre-existing seeded shops named below are skipped (to avoid the
// uniqueness collision on the membership compound index).

import { config } from "dotenv";
import { resolve } from "path";
// Load .env.local first (where MONGODB_URI lives in dev), then fall back to
// .env. Lets the script "just work" via `npx ts-node ...` without needing
// the user to inline MONGODB_URI on the command line.
config({ path: resolve(__dirname, "..", ".env.local") });
config();
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { connectDB } from "../src/lib/mongoose";
import {
  User,
  Shop,
  ShopMembership,
  Customer,
  StampCard,
  StampRequest,
  Subscription,
} from "../src/models";

const EMAIL = "mbathie+roast@gmail.com";
const PASSWORD = "testtest";
const NAME = "Mark (Roast)";

const SHOP_CONFIGS = [
  {
    name: "Roast Lab Coffee",
    bgColor: "stone-900",
    fgColor: "amber-400",
    bgPattern: "hexagons",
    stampThreshold: 8,
  },
  {
    name: "Cold Brew Co.",
    bgColor: "teal-900",
    fgColor: "orange-200",
    bgPattern: "polkaDots",
    stampThreshold: 10,
  },
];

const FIRST_NAMES = [
  "Alex", "Sam", "Jordan", "Riley", "Taylor", "Casey", "Morgan", "Avery",
  "Cameron", "Dakota", "Drew", "Emerson", "Finley", "Hayden", "Jamie",
  "Kai", "Logan", "Mason", "Noah", "Olivia", "Parker", "Quinn", "Reese",
  "Skyler", "Tatum", "Blair", "Marley", "Phoenix", "Rowan", "Sage",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function main() {
  const confirm = process.argv.includes("--confirm");

  await connectDB();

  console.log(`Seed plan for ${EMAIL}:`);
  console.log(`  - 1 User (or update existing)`);
  console.log(`  - ${SHOP_CONFIGS.length} Shops + ShopMemberships`);
  console.log(`  - ~25-35 Customers per shop`);
  console.log(`  - 1 StampCard per (customer, shop)`);
  console.log(`  - 2-8 StampRequests per customer (approved, history)`);
  console.log(`  - 1 Subscription per shop (status=active)`);
  console.log("");

  if (!confirm) {
    console.log("DRY RUN — pass --confirm to actually seed.");
    await mongoose.disconnect();
    return;
  }

  // 1. User
  const hash = await bcrypt.hash(PASSWORD, 10);
  let user = await User.findOne({ email: EMAIL });
  if (!user) {
    user = await User.create({
      email: EMAIL,
      name: NAME,
      hash,
      emailVerified: new Date(),
    });
    console.log(`Created user ${user.email}`);
  } else {
    user.hash = hash;
    user.emailVerified = user.emailVerified || new Date();
    if (!user.name) user.name = NAME;
    await user.save();
    console.log(`Reset password on existing user ${user.email}`);
  }

  // 2. Shops + memberships
  const createdShops: any[] = [];
  for (const cfg of SHOP_CONFIGS) {
    // Skip if this account already has a shop by that name (re-run safety).
    const existing = await Shop.findOne({ name: cfg.name, owner: user._id });
    if (existing) {
      console.log(`  SKIP "${cfg.name}" — already exists for this user`);
      createdShops.push(existing);
      continue;
    }

    let code = randomCode();
    while (await Shop.findOne({ code })) code = randomCode();

    const shop = await Shop.create({
      name: cfg.name,
      owner: user._id,
      code,
      bgColor: cfg.bgColor,
      fgColor: cfg.fgColor,
      bgPattern: cfg.bgPattern,
      stampThreshold: cfg.stampThreshold,
    });

    await ShopMembership.create({
      user: user._id,
      shop: shop._id,
      role: "owner",
      acceptedAt: new Date(),
    });

    createdShops.push(shop);
    console.log(`Created shop "${shop.name}" (${shop.code})`);

    // 3. Subscription (active) so the "paid plan" gauge shows up. The
    // stripe IDs are seed placeholders — billing-portal links won't work
    // for these shops but every other dashboard path does.
    const periodStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
    await Subscription.create({
      shop: shop._id,
      stripeCustomerId: `cus_seed_${shop._id.toString().slice(-6)}`,
      stripeSubscriptionId: `sub_seed_${shop._id.toString().slice(-6)}`,
      stripePriceId: "price_seed_roast",
      status: "active",
      planLabel: "Plus",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });
  }

  // Backfill planLabel on any pre-existing seeded subscriptions for these
  // shops — covers both subs created before planLabel existed and subs
  // still carrying the old "Roast" label from the previous naming.
  for (const shop of createdShops) {
    await Subscription.updateOne(
      {
        shop: shop._id,
        $or: [{ planLabel: { $exists: false } }, { planLabel: "Roast" }],
      },
      { $set: { planLabel: "Plus" } }
    );
  }

  // 4. Customers + stamp cards + history per shop
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  for (const shop of createdShops) {
    const customerCount = randInt(25, 35);
    let totalRequests = 0;
    for (let i = 0; i < customerCount; i++) {
      const first = randPick(FIRST_NAMES);
      const customer = await Customer.create({
        cookieId: `seed-${shop.code}-${i}-${randomCode()}`,
        name: first,
        email: `${first.toLowerCase()}+seed${i}${shop.code}@example.com`,
      });

      const stamps = randInt(0, shop.stampThreshold - 1);
      const totalEarned = stamps + randInt(0, 24);
      const freeRedeemed = Math.floor(totalEarned / shop.stampThreshold);

      await StampCard.create({
        shop: shop._id,
        customer: customer._id,
        stamps,
        totalEarned,
        freeRedeemed,
      });

      // Approved stamp-request rows give the dashboard a live-looking
      // history feed. expiresAt is set far in the future so the TTL index
      // on StampRequest.expiresAt doesn't sweep these out from under us.
      const requestCount = randInt(2, 8);
      for (let r = 0; r < requestCount; r++) {
        const isRedeem = r === requestCount - 1 && freeRedeemed > 0;
        const daysAgo = randInt(0, 60);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        await StampRequest.create({
          shop: shop._id,
          customer: customer._id,
          status: "approved",
          stampsAwarded: isRedeem ? 0 : 1,
          redeem: isRedeem,
          expiresAt: farFuture,
          createdAt,
          updatedAt: createdAt,
        });
        totalRequests++;
      }
    }
    console.log(
      `  Seeded ${customerCount} customers + ${totalRequests} approved requests in "${shop.name}"`
    );
  }

  console.log("");
  console.log("Done.");
  console.log("Sign in at /login with:");
  console.log(`  email:    ${EMAIL}`);
  console.log(`  password: ${PASSWORD}`);
  console.log("");
  console.log(
    "On first /dashboard hit you'll be prompted to pick between the two shops or 'All shops'."
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
