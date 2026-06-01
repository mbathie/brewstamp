/**
 * Seed realistic 6-month sample data into the LOCAL DB for screenshot purposes.
 *
 * Targets the shop owned by mbathie@gmail.com on localhost only — refuses to
 * run against a non-local MONGODB_URI as a safety guard.
 *
 *   npx tsx scripts/seed-sample-data.ts          # plan, no writes
 *   npx tsx scripts/seed-sample-data.ts --apply  # write to local DB
 *   npx tsx scripts/seed-sample-data.ts --apply --wipe-first
 *     ^ deletes existing stamp cards + requests for the shop first
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongoose";
import {
  User,
  Shop,
  Customer,
  StampCard,
  StampRequest,
} from "../src/models";

const apply = process.argv.includes("--apply");
const wipeFirst = process.argv.includes("--wipe-first");

// Allow targeting a different shop owner via --email
const emailIdx = process.argv.indexOf("--email");
const TARGET_EMAIL =
  emailIdx >= 0 && process.argv[emailIdx + 1]
    ? process.argv[emailIdx + 1]
    : "mbathie@gmail.com";

function isLocalUri(uri: string): boolean {
  return /^mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(uri);
}

// --- Realistic random helpers -------------------------------------------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Box-Muller for normally-distributed visit timing within a day
function randomHourMinute(): { hour: number; minute: number } {
  // Cafe peaks: 7-9am, smaller bump 10-11, mini-peak 12-1, trickle to 3pm
  const hourBuckets: number[] = [
    7, 7, 7, 7, 7, 7, 7, 7,
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
    9, 9, 9, 9, 9, 9, 9,
    10, 10, 10, 10, 10,
    11, 11, 11,
    12, 12, 12, 12,
    13, 13, 13,
    14, 14,
    15,
  ];
  const hour = pick(hourBuckets);
  const minute = randInt(0, 59);
  return { hour, minute };
}

const FIRST_NAMES = [
  "Olivia", "Liam", "Charlotte", "Noah", "Amelia", "Oliver", "Isla", "William",
  "Ava", "Henry", "Mia", "Leo", "Grace", "Lucas", "Chloe", "Hudson", "Zoe",
  "Ethan", "Sophie", "Mason", "Ruby", "Jack", "Lily", "Hugo", "Sienna", "Max",
  "Aria", "Theo", "Hazel", "Felix", "Eva", "Cooper", "Maya", "Archie", "Indie",
  "Sebastian", "Willow", "Ezra", "Frankie", "Eli",
];
const LAST_INITIALS = ["B", "C", "D", "F", "G", "H", "K", "L", "M", "N", "P", "R", "S", "T", "W"];

function genCustomerName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_INITIALS)}.`;
}

function genCookieId(): string {
  return [...Array(24)]
    .map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)])
    .join("");
}

// --- Main ----------------------------------------------------------------

async function main() {
  const uri = process.env.MONGODB_URI || "";
  if (!isLocalUri(uri)) {
    console.error(
      `Refusing to seed — MONGODB_URI is not a localhost URI (got: ${uri || "<empty>"}).\n` +
        "This script only runs against mongodb://localhost or 127.0.0.1.",
    );
    process.exit(1);
  }
  console.log(`Mongo URI: ${uri}\n`);

  await connectDB();

  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.error(`No user with email ${TARGET_EMAIL} in local DB.`);
    process.exit(1);
  }
  const shop = await Shop.findOne({ owner: user._id });
  if (!shop) {
    console.error(`User ${TARGET_EMAIL} has no shop in local DB.`);
    process.exit(1);
  }
  console.log(`Shop: "${(shop as any).name}" (${(shop as any).code})  id=${shop._id}`);
  const threshold: number = (shop as any).stampThreshold ?? 8;
  console.log(`Stamp threshold: ${threshold}\n`);

  if (wipeFirst) {
    if (!apply) {
      console.log("Would wipe existing stamp cards + requests for this shop.");
    } else {
      const sc = await StampCard.deleteMany({ shop: shop._id });
      const sr = await StampRequest.deleteMany({ shop: shop._id });
      console.log(`Wiped ${sc.deletedCount} stamp cards, ${sr.deletedCount} stamp requests.\n`);
    }
  }

  // ---- Plan the customer population --------------------------------------
  // Realistic cafe shape:
  //   ~10% true regulars   (35–90 visits over 6 months, ~weekly+)
  //   ~20% semi-regulars   (8–25 visits)
  //   ~70% casuals/tourists(1–5 visits)
  const NUM_CUSTOMERS = 150;
  const regularCount = Math.round(NUM_CUSTOMERS * 0.1);
  const semiCount = Math.round(NUM_CUSTOMERS * 0.2);
  const casualCount = NUM_CUSTOMERS - regularCount - semiCount;

  const customerPlan: Array<{
    name: string | null;
    email: string | null;
    cookieId: string;
    visitCount: number;
    band: "regular" | "semi" | "casual";
  }> = [];

  for (let i = 0; i < regularCount; i++) {
    const named = Math.random() < 0.8;
    customerPlan.push({
      name: named ? genCustomerName() : null,
      email: named && Math.random() < 0.5 ? `regular${i}@example.com` : null,
      cookieId: genCookieId(),
      visitCount: randInt(40, 90),
      band: "regular",
    });
  }
  for (let i = 0; i < semiCount; i++) {
    const named = Math.random() < 0.5;
    customerPlan.push({
      name: named ? genCustomerName() : null,
      email: named && Math.random() < 0.3 ? `semi${i}@example.com` : null,
      cookieId: genCookieId(),
      visitCount: randInt(8, 25),
      band: "semi",
    });
  }
  for (let i = 0; i < casualCount; i++) {
    const named = Math.random() < 0.2;
    customerPlan.push({
      name: named ? genCustomerName() : null,
      email: null,
      cookieId: genCookieId(),
      visitCount: randInt(1, 5),
      band: "casual",
    });
  }

  const totalStamps = customerPlan.reduce((s, c) => s + c.visitCount, 0);
  console.log(`Customers: ${NUM_CUSTOMERS} (regulars ${regularCount}, semi ${semiCount}, casual ${casualCount})`);
  console.log(`Planned stamp requests (approved): ${totalStamps}`);

  // Add a few rejected requests (~1.5%) and redemptions (~5% of stamp count
  // that crosses threshold).
  const rejectedCount = Math.round(totalStamps * 0.015);
  console.log(`Planned rejected requests: ${rejectedCount}`);

  if (!apply) {
    console.log("\nPlan only — re-run with --apply to write.");
    await mongoose.disconnect();
    return;
  }

  // ---- Create customers --------------------------------------------------
  console.log("\nCreating customers…");
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const now = new Date();

  const customerDocs = await Customer.insertMany(
    customerPlan.map((c) => ({
      cookieId: c.cookieId,
      name: c.name,
      email: c.email,
      // Customer createdAt = first visit time (will be set per-customer below
      // via update because insertMany doesn't honor manual timestamps when
      // timestamps:true is on the schema).
    })),
    { ordered: false },
  );
  console.log(`Inserted ${customerDocs.length} customers.`);

  // ---- For each customer, schedule visits and emit stamp requests --------
  console.log("\nGenerating stamp requests across 6 months…");

  const stampReqs: any[] = [];
  const cardPlans: Array<{
    customer: any;
    earned: number;
    redemptions: number;
    finalStamps: number; // current incomplete card progress
  }> = [];

  // Growth-biased visit-date sampler: weight today as 1.0, 180 days ago
  // as a small floor. Using (1 - daysAgo/180)^1.7 lifts the recent end.
  // Combined with weekday bias + a manual recent-7-day boost to make sure
  // the dashboard's "vs prev 7d" delta is positive.
  function recencyWeight(daysAgo: number): number {
    const t = Math.max(0, Math.min(180, daysAgo));
    const base = Math.pow(1 - t / 180, 1.7); // 0..1, ramps up toward today
    return 0.15 + 0.85 * base; // small floor so old days aren't empty
  }
  function dayOfWeekWeight(d: Date): number {
    const dow = d.getDay(); // 0 Sun .. 6 Sat
    if (dow === 0) return 0.55; // Sun quiet
    if (dow === 6) return 0.7; // Sat-ish
    return 1.0;
  }
  function sampleVisitDate(): Date {
    // Rejection-sample a daysAgo with weight = recency * dayOfWeek
    for (let i = 0; i < 50; i++) {
      const daysAgo = randInt(0, 180);
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      const w = recencyWeight(daysAgo) * dayOfWeekWeight(d);
      if (Math.random() < w) return d;
    }
    // Fallback
    const d = new Date(now);
    d.setDate(d.getDate() - randInt(0, 30));
    return d;
  }

  for (let i = 0; i < customerPlan.length; i++) {
    const plan = customerPlan[i];
    const customer = customerDocs[i];
    const visits = plan.visitCount;

    const visitDates: Date[] = [];
    for (let v = 0; v < visits; v++) {
      visitDates.push(sampleVisitDate());
    }

    // Boost: for regulars, shift roughly 20% of their visits into the most
    // recent 14-day window so the "last week vs prior week" comparison is
    // clearly positive on the Week dashboard view.
    if (plan.band === "regular") {
      const boostCount = Math.ceil(visits * 0.2);
      for (let b = 0; b < boostCount; b++) {
        // Replace a random old visit with a recent one (weighted toward last 7d)
        const replaceIdx = Math.floor(Math.random() * visitDates.length);
        const d = new Date(now);
        // 70% in last 7 days, 30% in prior 7
        d.setDate(d.getDate() - (Math.random() < 0.7 ? randInt(0, 6) : randInt(7, 13)));
        // Avoid Sunday for boost — keep weekday bias intact
        if (d.getDay() === 0) d.setDate(d.getDate() - 1);
        visitDates[replaceIdx] = d;
      }
    }

    visitDates.sort((a, b) => a.getTime() - b.getTime());

    // Track card progress and emit redemptions when the card fills.
    let stampsOnCurrentCard = 0;
    let totalEarned = 0;
    let redemptions = 0;

    for (const visit of visitDates) {
      const { hour, minute } = randomHourMinute();
      visit.setHours(hour, minute, randInt(0, 59), 0);

      const isRedeem = stampsOnCurrentCard >= threshold;

      stampReqs.push({
        shop: shop._id,
        customer: customer._id,
        status: "approved",
        stampsAwarded: isRedeem ? 0 : 1,
        redeem: isRedeem,
        expiresAt: undefined,
        createdAt: visit,
        updatedAt: visit,
      });

      if (isRedeem) {
        redemptions += 1;
        stampsOnCurrentCard = 0;
      } else {
        stampsOnCurrentCard += 1;
        totalEarned += 1;
      }
    }

    cardPlans.push({
      customer,
      earned: totalEarned,
      redemptions,
      finalStamps: stampsOnCurrentCard,
    });
  }

  // Sprinkle rejected requests across the timeline (random customers)
  for (let i = 0; i < rejectedCount; i++) {
    const customer = pick(customerDocs);
    const daysAgo = randInt(0, 180);
    const when = new Date(now);
    when.setDate(when.getDate() - daysAgo);
    const { hour, minute } = randomHourMinute();
    when.setHours(hour, minute, randInt(0, 59), 0);

    stampReqs.push({
      shop: shop._id,
      customer: (customer as any)._id,
      status: "rejected",
      stampsAwarded: 0,
      redeem: false,
      expiresAt: undefined,
      createdAt: when,
      updatedAt: when,
    });
  }

  console.log(`Total stamp request docs to insert: ${stampReqs.length}`);

  // Insert in batches to avoid hitting the 16 MB BSON limit per op
  const BATCH = 1000;
  let inserted = 0;
  for (let i = 0; i < stampReqs.length; i += BATCH) {
    const slice = stampReqs.slice(i, i + BATCH);
    await StampRequest.insertMany(slice, { ordered: false });
    inserted += slice.length;
    process.stdout.write(`  inserted ${inserted}/${stampReqs.length}\r`);
  }
  console.log(`\n  done.`);

  // ---- Create / update StampCards ---------------------------------------
  console.log("\nWriting stamp cards…");
  const cardOps = cardPlans.map((p) => ({
    updateOne: {
      filter: { shop: shop._id, customer: p.customer._id },
      update: {
        $set: {
          shop: shop._id,
          customer: p.customer._id,
          stamps: p.finalStamps,
          totalEarned: p.earned,
          freeRedeemed: p.redemptions,
          tags: [],
          notes: "",
        },
      },
      upsert: true,
    },
  }));
  await StampCard.bulkWrite(cardOps, { ordered: false });
  console.log(`  ${cardOps.length} stamp cards upserted.`);

  // ---- Summary ----------------------------------------------------------
  const approvedCount = await StampRequest.countDocuments({
    shop: shop._id,
    status: "approved",
  });
  const redeemCount = await StampRequest.countDocuments({
    shop: shop._id,
    status: "approved",
    redeem: true,
  });
  const rejectedDocs = await StampRequest.countDocuments({
    shop: shop._id,
    status: "rejected",
  });
  const customerCount = await StampCard.countDocuments({ shop: shop._id });

  console.log("\n──────────── Summary ────────────");
  console.log(`Customers (stamp cards):  ${customerCount}`);
  console.log(`Approved stamp requests:  ${approvedCount}`);
  console.log(`  of which redemptions:   ${redeemCount}`);
  console.log(`Rejected stamp requests:  ${rejectedDocs}`);
  console.log("─────────────────────────────────");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
