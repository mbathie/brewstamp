// Backfill ShopMembership rows from the existing Shop.owner field.
//
// Before multi-shop, every Shop had exactly one owner stored on `Shop.owner`.
// The multi-shop model introduces ShopMembership { user, shop, role } as the
// canonical "who can access what" join. This script walks every Shop and
// upserts a membership with role="owner" so the rest of the app can switch
// to membership-driven access without breaking existing accounts.
//
// Idempotent — safe to re-run. Skips shops where the owner-membership
// already exists.
//
// Usage (DRY RUN):
//   MONGODB_URI="<uri>" npx ts-node \
//     --project tsconfig.server.json \
//     scripts/migrate-shop-memberships.ts
//
// Usage (REAL WRITE):
//   MONGODB_URI="<uri>" npx ts-node \
//     --project tsconfig.server.json \
//     scripts/migrate-shop-memberships.ts --confirm

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongoose";
import { Shop, ShopMembership } from "../src/models";

async function main() {
  const confirm = process.argv.includes("--confirm");

  await connectDB();

  const shops = await Shop.find({}, { _id: 1, name: 1, owner: 1, createdAt: 1 });
  console.log(`Found ${shops.length} shops.`);

  let toCreate = 0;
  let alreadyExist = 0;
  let skippedNoOwner = 0;

  for (const shop of shops) {
    if (!shop.owner) {
      skippedNoOwner++;
      console.log(`  SKIP "${shop.name}" (${shop._id}) — no owner field`);
      continue;
    }
    const existing = await ShopMembership.findOne({
      user: shop.owner,
      shop: shop._id,
    });
    if (existing) {
      alreadyExist++;
      continue;
    }
    toCreate++;
    console.log(
      `  CREATE  user=${shop.owner}  shop=${shop._id}  ("${shop.name}")  role=owner`
    );
    if (confirm) {
      await ShopMembership.create({
        user: shop.owner,
        shop: shop._id,
        role: "owner",
        acceptedAt: shop.createdAt || new Date(),
      });
    }
  }

  console.log("");
  console.log("Summary:");
  console.log(`  ${alreadyExist} memberships already existed`);
  console.log(`  ${toCreate} memberships ${confirm ? "created" : "would be created"}`);
  console.log(`  ${skippedNoOwner} shops skipped (no owner)`);

  if (!confirm) {
    console.log("");
    console.log("DRY RUN — no changes made. Re-run with --confirm to write.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
