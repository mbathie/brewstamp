import cron from "node-cron";
import { connectDB } from "./mongoose";
import Shop from "../models/Shop";
import User from "../models/User";
import StampCard from "../models/StampCard";
import { sendDay3NudgeEmail, sendDay7FollowUpEmail } from "./email";

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
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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

  // Collect all shop IDs to batch-query stamp counts
  const allShopIds = [
    ...day3Shops.map((s: any) => s._id),
    ...day7Shops.map((s: any) => s._id),
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
      });
      console.log(
        `[Drip] Day 7 email sent to ${to} for shop "${shop.name}"`
      );
    }
  }

  console.log(
    `[Drip] Run complete. Day 3: ${day3Shops.length} shops processed. Day 7: ${day7Shops.length} shops processed.`
  );
}
