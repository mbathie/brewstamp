/**
 * Grandfather every existing shop onto the 100-stamp Free trial tier.
 *
 *   MONGODB_URI=<uri> npx tsx scripts/migrate-free-tier.ts          # dry run
 *   MONGODB_URI=<uri> npx tsx scripts/migrate-free-tier.ts --apply  # write
 *
 * From 2026-09-30 new shops get Shop.freeTier = "free_50" at creation (see
 * DEFAULT_FREE_TIER in src/lib/plans.ts). This sets "free_100" on every shop
 * that has no freeTier yet — i.e. every shop created before that code shipped.
 * It never touches a shop that already has a tier, so it's safe to run before
 * or after the deploy, and to re-run. (A shop without a tier is treated as
 * free_100 by freeTierOf() anyway; this makes it explicit.)
 */
import { connectDB } from "@/lib/mongoose";
import { Shop } from "@/models";

async function main() {
  const apply = process.argv.includes("--apply");
  await connectDB();

  const filter = { freeTier: { $exists: false } };
  const [missing, byTier] = await Promise.all([
    Shop.countDocuments(filter),
    Shop.aggregate([{ $group: { _id: { $ifNull: ["$freeTier", "(none)"] }, n: { $sum: 1 } } }]),
  ]);
  console.log("Shops by freeTier before:", Object.fromEntries(byTier.map((r: any) => [r._id, r.n])));
  console.log(`${missing} shop(s) have no freeTier and would be set to free_100.`);

  if (!apply) {
    console.log("Dry run — pass --apply to write.");
    process.exit(0);
  }

  const res = await Shop.updateMany(filter, { $set: { freeTier: "free_100" } });
  console.log(`Updated ${res.modifiedCount} shop(s) to free_100.`);
  const after = await Shop.aggregate([{ $group: { _id: { $ifNull: ["$freeTier", "(none)"] }, n: { $sum: 1 } } }]);
  console.log("Shops by freeTier after:", Object.fromEntries(after.map((r: any) => [r._id, r.n])));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
