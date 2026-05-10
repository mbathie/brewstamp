// Delete a Brewstamp user and everything they own.
//
// Usage (DRY RUN — shows what would be deleted, makes no changes):
//   MONGODB_URI="<prod-uri>" npx ts-node \
//     --project tsconfig.server.json \
//     scripts/delete-user.ts user@example.com
//
// Usage (REAL DELETE — pass --confirm to actually delete):
//   MONGODB_URI="<prod-uri>" npx ts-node \
//     --project tsconfig.server.json \
//     scripts/delete-user.ts user@example.com --confirm
//
// What gets deleted:
//   - User row matching the email
//   - Account rows (OAuth links) where userId = user._id
//   - VerificationToken rows where email = user email
//   - For every Shop where owner = user._id:
//     - the Shop itself
//     - all StampCards for that shop
//     - all StampRequests for that shop
//     - all Subscriptions for that shop

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongoose";
import {
  User,
  Account,
  Shop,
  StampCard,
  StampRequest,
  Subscription,
  VerificationToken,
} from "../src/models";

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"));
  const confirm = args.includes("--confirm");

  if (!email) {
    console.error("Usage: delete-user.ts <email> [--confirm]");
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  console.log(`User: ${user.email}  (id ${user._id})  created ${user.createdAt}`);

  const shops = await Shop.find({ owner: user._id });
  const accounts = await Account.find({ userId: user._id });
  const tokens = await VerificationToken.find({ identifier: email });

  let stampCardCount = 0;
  let stampRequestCount = 0;
  let subscriptionCount = 0;

  for (const shop of shops) {
    const sc = await StampCard.countDocuments({ shop: shop._id });
    const sr = await StampRequest.countDocuments({ shop: shop._id });
    const sub = await Subscription.countDocuments({ shop: shop._id });
    stampCardCount += sc;
    stampRequestCount += sr;
    subscriptionCount += sub;
    console.log(
      `  Shop "${shop.name}" (${shop.code}) — ${sc} stamp cards, ${sr} stamp requests, ${sub} subscriptions`
    );
  }

  console.log("");
  console.log("Will delete:");
  console.log(`  ${1} User`);
  console.log(`  ${accounts.length} Account(s) (OAuth links)`);
  console.log(`  ${tokens.length} VerificationToken(s)`);
  console.log(`  ${shops.length} Shop(s)`);
  console.log(`  ${stampCardCount} StampCard(s)`);
  console.log(`  ${stampRequestCount} StampRequest(s)`);
  console.log(`  ${subscriptionCount} Subscription(s)`);
  console.log("");

  if (!confirm) {
    console.log("DRY RUN — no changes made. Re-run with --confirm to delete.");
    await mongoose.disconnect();
    return;
  }

  console.log("Deleting...");
  for (const shop of shops) {
    await StampCard.deleteMany({ shop: shop._id });
    await StampRequest.deleteMany({ shop: shop._id });
    await Subscription.deleteMany({ shop: shop._id });
  }
  await Shop.deleteMany({ owner: user._id });
  await Account.deleteMany({ userId: user._id });
  await VerificationToken.deleteMany({ identifier: email });
  await User.deleteOne({ _id: user._id });

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
