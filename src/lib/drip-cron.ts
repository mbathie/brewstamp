import cron from "node-cron";
import { connectDB } from "./mongoose";
import Shop from "../models/Shop";
import User from "../models/User";
import StampCard from "../models/StampCard";
import StampRequest from "../models/StampRequest";
import Subscription from "../models/Subscription";
import { sendGoLiveNudgeEmail, sendUpgradeNudgeEmail } from "./email";

// `User` is imported so its model is registered for the `populate("owner")`
// calls below.
void User;

export function startDripCron() {
  // Daily at 8am AEDT
  cron.schedule("0 8 * * *", () => runDripEmails(), {
    timezone: "Australia/Sydney",
  });
  console.log("[Drip] Cron scheduled: daily 8am AEDT");
}

export async function runDripEmails() {
  await connectDB();

  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const isDev = process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ?? false;
  const EXCLUDED_EMAILS = ["mbathie@gmail.com"];

  // ── "Go live" nudge ───────────────────────────────────────────────────────
  // One behaviour-triggered email, replacing the old day-1/3/7/14 calendar drip
  // (which reached every stalled shop and converted none). Targets shops that
  // set up their card — and maybe tested a couple of stamps — but never went
  // live: branded, created 5+ days ago, not on Pro, not "engaged", and idle for
  // a week. Sent once, in the shop's language.
  const goLiveCandidates = await Shop.find({
    perkMode: { $ne: true },
    goLiveNudgeSent: { $ne: true },
    createdAt: { $lte: fiveDaysAgo },
  }).populate("owner");

  const goLiveIds = goLiveCandidates.map((s: any) => s._id);

  const [goLiveStats, goLiveLastActivity, goLivePaid] = await Promise.all([
    StampCard.aggregate([
      { $match: { shop: { $in: goLiveIds } } },
      {
        $group: {
          _id: "$shop",
          stamps: { $sum: "$totalEarned" },
          customers: { $sum: { $cond: [{ $gt: ["$totalEarned", 0] }, 1, 0] } },
        },
      },
    ]),
    StampRequest.aggregate([
      { $match: { shop: { $in: goLiveIds }, status: "approved" } },
      { $group: { _id: "$shop", last: { $max: "$createdAt" } } },
    ]),
    Subscription.find({ shop: { $in: goLiveIds }, status: "active" }).select(
      "shop",
    ),
  ]);

  const statsMap = new Map<string, { stamps: number; customers: number }>(
    goLiveStats.map((s: any) => [
      s._id.toString(),
      { stamps: s.stamps, customers: s.customers },
    ]),
  );
  const lastActivityMap = new Map<string, Date>(
    goLiveLastActivity.map((r: any) => [r._id.toString(), r.last]),
  );
  const paidIds = new Set(goLivePaid.map((s: any) => s.shop.toString()));

  const isBranded = (shop: any) =>
    !!shop.logo ||
    (shop.bgColor && shop.bgColor !== "stone-800") ||
    (shop.fgColor && shop.fgColor !== "amber-600") ||
    (shop.bgPattern && shop.bgPattern !== "none");

  let goLiveCount = 0;
  for (const shop of goLiveCandidates) {
    const id = shop._id.toString();
    const stats = statsMap.get(id);
    const engaged =
      paidIds.has(id) ||
      (stats?.customers ?? 0) >= 10 ||
      (stats?.stamps ?? 0) >= 50;
    const last = lastActivityMap.get(id);
    const idle = !last || last <= sevenDaysAgo;

    // Not in the stalled state yet (not branded, already launched, or actively
    // in use) — skip without marking, so a later run can re-evaluate.
    if (!isBranded(shop) || engaged || !idle) continue;

    // Qualifies — mark sent first so we only ever nudge once.
    await Shop.updateOne({ _id: shop._id }, { goLiveNudgeSent: true });

    const owner = shop.owner as any;
    if (!owner?.email || EXCLUDED_EMAILS.includes(owner.email)) continue;

    const to = isDev ? "mbathie@gmail.com" : owner.email;
    await sendGoLiveNudgeEmail({
      to,
      merchantName: owner.name,
      shopName: shop.name,
      language: shop.language || "en",
    });
    console.log(`[Drip] Go-live nudge sent to ${to} for shop "${shop.name}"`);
    goLiveCount++;
  }

  // ── Upgrade nudge ─────────────────────────────────────────────────────────
  // Shops with 60+ stamps, no subscription, not yet notified. (The one
  // lifecycle email with a real hit rate, so it stays.)
  const upgradeShops = await Shop.find({
    upgradeNudgeSent: { $ne: true },
  }).populate("owner");

  const upgradeShopIds = upgradeShops.map((s: any) => s._id);

  const activeSubShopIds = new Set(
    (
      await Subscription.find({
        shop: { $in: upgradeShopIds },
        status: "active",
      }).select("shop")
    ).map((s: any) => s.shop.toString()),
  );

  const upgradeStampCounts = await StampCard.aggregate([
    { $match: { shop: { $in: upgradeShopIds } } },
    { $group: { _id: "$shop", total: { $sum: "$totalEarned" } } },
  ]);
  const upgradeStampMap = new Map<string, number>(
    upgradeStampCounts.map((s: any) => [s._id.toString(), s.total]),
  );

  let upgradeCount = 0;
  for (const shop of upgradeShops) {
    const shopIdStr = shop._id.toString();
    const stamps = upgradeStampMap.get(shopIdStr) || 0;

    // Skip if under 60 stamps or already on Pro. 60 (rather than 80) gives shop
    // owners breathing room before they hit the 100-stamp free-tier ceiling.
    if (stamps < 60 || activeSubShopIds.has(shopIdStr)) continue;

    const owner = shop.owner as any;
    await Shop.updateOne({ _id: shop._id }, { upgradeNudgeSent: true });

    if (!owner?.email || EXCLUDED_EMAILS.includes(owner.email)) continue;

    const to = isDev ? "mbathie@gmail.com" : owner.email;
    await sendUpgradeNudgeEmail({
      to,
      merchantName: owner.name,
      shopName: shop.name,
      stampsUsed: stamps,
    });
    console.log(
      `[Drip] Upgrade nudge sent to ${to} for shop "${shop.name}" (${stamps} stamps)`,
    );
    upgradeCount++;
  }

  console.log(
    `[Drip] Run complete. Go-live nudges: ${goLiveCount}, Upgrade: ${upgradeCount} emails sent.`,
  );
}
