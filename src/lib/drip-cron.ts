import cron from "node-cron";
import { connectDB } from "./mongoose";
import Shop from "../models/Shop";
import User from "../models/User";
import StampCard from "../models/StampCard";
import Subscription from "../models/Subscription";
import {
  sendDay1WelcomeEmail,
  sendDay3NudgeEmail,
  sendDay7FollowUpEmail,
  sendDay14ReengagementEmail,
  sendUpgradeNudgeEmail,
} from "./email";

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
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Day 1: shops created >= 1 day ago that haven't received the day 1 email
  const day1Shops = await Shop.find({
    createdAt: { $lte: oneDayAgo },
    dripDay1Sent: { $ne: true },
  }).populate("owner");

  // Day 3: shops created >= 3 days ago that haven't received the day 3 email
  const day3Shops = await Shop.find({
    createdAt: { $lte: threeDaysAgo },
    dripDay3Sent: { $ne: true },
  }).populate("owner");

  // Day 7: shops created >= 7 days ago that haven't received the day 7 email
  const day7Shops = await Shop.find({
    createdAt: { $lte: sevenDaysAgo },
    dripDay7Sent: { $ne: true },
  }).populate("owner");

  // Day 14: shops created >= 14 days ago that haven't received the day 14 email
  const day14Shops = await Shop.find({
    createdAt: { $lte: fourteenDaysAgo },
    dripDay14Sent: { $ne: true },
  }).populate("owner");

  // Collect all shop IDs to batch-query stamp counts
  const allShopIds = [
    ...day1Shops.map((s: any) => s._id),
    ...day3Shops.map((s: any) => s._id),
    ...day7Shops.map((s: any) => s._id),
    ...day14Shops.map((s: any) => s._id),
  ];

  // Batch aggregate total stamps per shop
  const stampCounts = await StampCard.aggregate([
    { $match: { shop: { $in: allShopIds } } },
    { $group: { _id: "$shop", total: { $sum: "$totalEarned" } } },
  ]);
  const stampMap = new Map<string, number>(
    stampCounts.map((s: any) => [s._id.toString(), s.total])
  );

  const isDev =
    process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ?? false;
  const EXCLUDED_EMAILS = ["mbathie@gmail.com"];

  // Process Day 1 emails
  for (const shop of day1Shops) {
    const owner = shop.owner as any;
    if (!owner?.email) {
      await Shop.updateOne({ _id: shop._id }, { dripDay1Sent: true });
      continue;
    }

    const stamps = stampMap.get(shop._id.toString()) || 0;

    // Mark as sent regardless (avoids re-evaluating daily)
    await Shop.updateOne({ _id: shop._id }, { dripDay1Sent: true });

    // Only send email if stamp count <= 10 and not excluded
    if (stamps <= 10 && !EXCLUDED_EMAILS.includes(owner.email)) {
      const to = isDev ? "mbathie@gmail.com" : owner.email;
      await sendDay1WelcomeEmail({
        to,
        merchantName: owner.name,
        shopName: shop.name,
      });
      console.log(
        `[Drip] Day 1 email sent to ${to} for shop "${shop.name}"`
      );
    }
  }

  // Process Day 3 emails
  for (const shop of day3Shops) {
    const owner = shop.owner as any;
    if (!owner?.email) {
      await Shop.updateOne({ _id: shop._id }, { dripDay3Sent: true });
      continue;
    }

    const stamps = stampMap.get(shop._id.toString()) || 0;

    // Mark as sent regardless (avoids re-evaluating daily)
    await Shop.updateOne({ _id: shop._id }, { dripDay3Sent: true });

    // Only send email if stamp count <= 10 and not excluded
    if (stamps <= 10 && !EXCLUDED_EMAILS.includes(owner.email)) {
      const to = isDev ? "mbathie@gmail.com" : owner.email;
      await sendDay3NudgeEmail({
        to,
        merchantName: owner.name,
        shopName: shop.name,
      });
      console.log(
        `[Drip] Day 3 email sent to ${to} for shop "${shop.name}"`
      );
    }
  }

  // Process Day 7 emails
  for (const shop of day7Shops) {
    const owner = shop.owner as any;
    if (!owner?.email) {
      await Shop.updateOne({ _id: shop._id }, { dripDay7Sent: true });
      continue;
    }

    const stamps = stampMap.get(shop._id.toString()) || 0;

    // Mark as sent regardless
    await Shop.updateOne({ _id: shop._id }, { dripDay7Sent: true });

    // Only send email if stamp count <= 10 and not excluded
    if (stamps <= 10 && !EXCLUDED_EMAILS.includes(owner.email)) {
      const to = isDev ? "mbathie@gmail.com" : owner.email;
      await sendDay7FollowUpEmail({
        to,
        merchantName: owner.name,
        shopName: shop.name,
        stamps,
      });
      console.log(
        `[Drip] Day 7 email sent to ${to} for shop "${shop.name}"`
      );
    }
  }

  // Process Day 14 emails
  for (const shop of day14Shops) {
    const owner = shop.owner as any;
    if (!owner?.email) {
      await Shop.updateOne({ _id: shop._id }, { dripDay14Sent: true });
      continue;
    }

    const stamps = stampMap.get(shop._id.toString()) || 0;

    // Mark as sent regardless
    await Shop.updateOne({ _id: shop._id }, { dripDay14Sent: true });

    // Only send email if stamp count <= 10 and not excluded
    if (stamps <= 10 && !EXCLUDED_EMAILS.includes(owner.email)) {
      const to = isDev ? "mbathie@gmail.com" : owner.email;
      await sendDay14ReengagementEmail({
        to,
        merchantName: owner.name,
        shopName: shop.name,
        stamps,
      });
      console.log(
        `[Drip] Day 14 email sent to ${to} for shop "${shop.name}"`
      );
    }
  }

  // Upgrade nudge: shops with 80+ stamps, no subscription, not yet notified
  const upgradeShops = await Shop.find({
    upgradeNudgeSent: { $ne: true },
  }).populate("owner");

  const upgradeShopIds = upgradeShops.map((s: any) => s._id);

  // Get active subscriptions to exclude Pro shops
  const activeSubShopIds = new Set(
    (
      await Subscription.find({
        shop: { $in: upgradeShopIds },
        status: "active",
      }).select("shop")
    ).map((s: any) => s.shop.toString())
  );

  // Get stamp counts for these shops
  const upgradeStampCounts = await StampCard.aggregate([
    { $match: { shop: { $in: upgradeShopIds } } },
    { $group: { _id: "$shop", total: { $sum: "$totalEarned" } } },
  ]);
  const upgradeStampMap = new Map<string, number>(
    upgradeStampCounts.map((s: any) => [s._id.toString(), s.total])
  );

  let upgradeCount = 0;
  for (const shop of upgradeShops) {
    const shopIdStr = shop._id.toString();
    const stamps = upgradeStampMap.get(shopIdStr) || 0;

    // Skip if under 80 stamps or already on Pro
    if (stamps < 80 || activeSubShopIds.has(shopIdStr)) continue;

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
      `[Drip] Upgrade nudge sent to ${to} for shop "${shop.name}" (${stamps} stamps)`
    );
    upgradeCount++;
  }

  console.log(
    `[Drip] Run complete. Day 1: ${day1Shops.length}, Day 3: ${day3Shops.length}, Day 7: ${day7Shops.length}, Day 14: ${day14Shops.length}, Upgrade: ${upgradeCount} emails sent.`
  );
}
