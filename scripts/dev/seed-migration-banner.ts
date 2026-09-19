// Local-only: give the LIMIT100 test shop an un-migrated Stripe sub so the
// dashboard "update your payment card" banner can be eyeballed.
import "../../src/lib/load-env";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { Shop, Subscription } from "../../src/models";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const shop = await Shop.findOne({ code: "LIMIT100" });
  if (!shop) throw new Error("LIMIT100 shop not found");
  const now = new Date();
  const start = new Date(now.getTime() - 23 * 86_400_000);
  const end = new Date(start.getTime() + 30 * 86_400_000);
  const token = randomBytes(32).toString("hex");
  await Subscription.findOneAndUpdate(
    { shop: shop._id },
    {
      $set: {
        shop: shop._id,
        provider: "stripe",
        status: "active",
        stripeSubscriptionId: "sub_localtest_limit100",
        stripeCustomerId: "cus_localtest_limit100",
        stripePriceId: "price_localtest_pro_aud",
        planSlug: "pro",
        planLabel: "Pro",
        interval: "month",
        priceCents: 700,
        currency: "aud",
        currentPeriodStart: start,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: false,
        migrationToken: token,
        migrationEmailedAt: new Date(now.getTime() - 4 * 86_400_000),
        migratedAt: null,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`seeded Stripe Pro sub on ${shop.name}; renews ${end.toISOString().slice(0, 10)}; link /billing/migrate/${token}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
