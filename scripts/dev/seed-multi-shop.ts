/**
 * Turn a LOCAL test account into a 10-shop group with realistic activity, for
 * trying the "All shops" dashboard, the shop switcher and multi-shop Team
 * access. Refuses to run against anything but a localhost MONGODB_URI.
 *
 *   npx tsx scripts/dev/seed-multi-shop.ts            # plan, no writes
 *   npx tsx scripts/dev/seed-multi-shop.ts --apply    # write
 *   npx tsx scripts/dev/seed-multi-shop.ts --wipe     # remove everything it made
 *   ... --email someone@example.com                   # another owner (default mbathie@gmail.com)
 *
 * What --apply does, idempotently (re-running replaces the seeded data):
 * - Puts the owner's first shop on the archived Max plan (10 shops) via a
 *   seed subscription (sub_seed_*, ignored by revenue reports).
 * - Adds shops up to 10, each with ~120 days of stamps in Australia/Sydney
 *   time: different sizes, one growing fast, one in decline, one opened three
 *   weeks ago. A pool of customers visits two or three shops.
 * - Adds four team logins with access to different subsets of shops, plus a
 *   pending invite to two shops.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(__dirname, "..", "..", ".env.local") });
config({ path: resolve(__dirname, "..", "..", ".env") });

import mongoose, { Types } from "mongoose";
import crypto from "crypto";
import { connectDB } from "../../src/lib/mongoose";
import { Customer, Invite, Shop, ShopMembership, StampCard, StampRequest, Subscription, User } from "../../src/models";
import { DEFAULT_FREE_TIER } from "../../src/lib/plans";

const apply = process.argv.includes("--apply");
const wipe = process.argv.includes("--wipe");
const emailIdx = process.argv.indexOf("--email");
const OWNER_EMAIL = emailIdx >= 0 ? process.argv[emailIdx + 1] : "mbathie@gmail.com";

const TZ = "Australia/Sydney";
const DAYS = 120;
const SEED_SUB = "sub_seed_multishop";
// Customers and team logins this script makes are recognisable by these.
const COOKIE_PREFIX = "seedms";
const TEAM_DOMAIN = "brewz-team.example.com";

// size: relative traffic; trend: >1 growing, <1 declining; openedDaysAgo
// limits history for a new shop.
const NEW_SHOPS: { name: string; size: number; trend: number; openedDaysAgo?: number }[] = [
  { name: "Brewz Lennox Head", size: 1.1, trend: 1.0 },
  { name: "Brewz Ballina", size: 1.4, trend: 1.25 },
  { name: "Brewz Bangalow", size: 0.8, trend: 1.0 },
  { name: "Brewz Mullumbimby", size: 0.6, trend: 0.6 },
  { name: "Brewz Suffolk Park", size: 0.5, trend: 1.05 },
  { name: "Brewz Kingscliff", size: 1.0, trend: 1.1 },
  { name: "Brewz Lismore", size: 0.9, trend: 0.95 },
  { name: "Brewz Yamba", size: 0.7, trend: 1.0 },
  { name: "Brewz Brunswick Heads", size: 0.4, trend: 1.0, openedDaysAgo: 21 },
];

const TEAM: { name: string; role: "manager" | "staff"; shops: "all" | string[] }[] = [
  { name: "Priya Shah", role: "manager", shops: "all" },
  { name: "Sam Taylor", role: "staff", shops: ["Brewz Ballina", "Brewz Lennox Head"] },
  { name: "Jess Moore", role: "staff", shops: ["Brewz Bangalow", "Brewz Mullumbimby", "Brewz Brunswick Heads"] },
  { name: "Tom Nguyen", role: "staff", shops: ["MAIN"] },
];
const INVITE = { email: `new.barista@${TEAM_DOMAIN}`, role: "staff" as const, shops: ["Brewz Kingscliff", "Brewz Yamba"] };

const FIRST = ["Olivia", "Liam", "Charlotte", "Noah", "Amelia", "Oliver", "Isla", "William", "Ava", "Henry", "Mia", "Leo", "Grace", "Lucas", "Chloe", "Hudson", "Zoe", "Ethan", "Sophie", "Mason", "Ruby", "Jack", "Lily", "Hugo", "Sienna", "Max", "Aria", "Theo", "Hazel", "Felix"];
const LAST = ["B", "C", "D", "F", "G", "H", "K", "L", "M", "N", "P", "R", "S", "T", "W"];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const cookieId = () => `${COOKIE_PREFIX}${crypto.randomBytes(10).toString("hex")}`;

// Cafe hours, local: a 7–9am rush, a lunch bump, quiet afternoons.
const HOURS = [6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12, 12, 12, 13, 13, 14, 15];

/** A Date for local (Sydney) day `daysAgo` at a cafe-shaped hour. */
function visitAt(daysAgo: number): Date | null {
  const hour = pick(HOURS);
  const minute = randInt(0, 59);
  const now = new Date();
  // Today's local date in Sydney, then step back.
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
  const [y, m, d] = ymd.split("-").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d - daysAgo, hour, minute, randInt(0, 59));
  // Sydney is UTC+10/+11; correct with the offset at that instant.
  const offsetMin = tzOffsetMinutes(new Date(utcGuess));
  const at = new Date(utcGuess - offsetMin * 60_000);
  return at > now ? null : at; // no visits later today than now
}

function tzOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const local = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"));
  return Math.round((local - at.getTime()) / 60_000);
}

/** Pick a day in the shop's history, weighted by its trend and the weekday. */
function sampleDay(trend: number, history: number): number {
  for (let i = 0; i < 50; i++) {
    const daysAgo = randInt(0, history - 1);
    // trend 1.25 → today ~1.6x as busy as the start; 0.6 → about half.
    const t = 1 - daysAgo / history;
    const w = Math.pow(trend, 2 * t) / Math.max(1, Math.pow(trend, 2));
    const dow = new Date(Date.now() - daysAgo * 86_400_000).getDay();
    const weekday = dow === 0 ? 0.55 : dow === 6 ? 0.75 : 1;
    if (Math.random() < w * weekday) return daysAgo;
  }
  return randInt(0, Math.min(history - 1, 30));
}

async function main() {
  const uri = process.env.MONGODB_URI || "";
  if (!/^mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(uri)) {
    console.error(`Refusing to run: MONGODB_URI is not localhost (${uri || "unset"}).`);
    process.exit(1);
  }
  await connectDB();

  const owner = await User.findOne({ email: OWNER_EMAIL });
  if (!owner) throw new Error(`No user ${OWNER_EMAIL} in the local DB.`);
  const owned = await Shop.find({ owner: owner._id }).select("name").lean<{ _id: Types.ObjectId; name: string }[]>();
  const main = owned.find((s) => /byron/i.test(s.name)) ?? owned[0];
  if (!main) throw new Error(`${OWNER_EMAIL} owns no shop.`);
  console.log(`Owner ${OWNER_EMAIL} · main shop "${main.name}" · owns ${owned.length} shop(s)`);

  const seededShops = await Shop.find({ owner: owner._id, name: { $in: NEW_SHOPS.map((s) => s.name) } })
    .select("name")
    .lean<{ _id: Types.ObjectId; name: string }[]>();
  const allIds = [main._id, ...seededShops.map((s) => s._id)];

  // ── Wipe what a previous run made ─────────────────────────────────────
  const seedCustomers = await Customer.find({ cookieId: new RegExp(`^${COOKIE_PREFIX}`) }).select("_id").lean();
  const teamUsers = await User.find({ email: new RegExp(`@${TEAM_DOMAIN.replace(/\./g, "\\.")}$`) }).select("_id").lean();
  console.log(
    `Existing seed: ${seededShops.length} shops, ${seedCustomers.length} customers, ${teamUsers.length} team logins`,
  );
  if (!apply && !wipe) {
    console.log(
      `\nPlan: Max plan on "${main.name}", ${NEW_SHOPS.length} shops (10 total), ~${DAYS} days of stamps, ` +
        `${TEAM.length} team logins, 1 pending invite.\nRe-run with --apply to write (or --wipe to remove).`,
    );
    await mongoose.disconnect();
    return;
  }

  const custIds = seedCustomers.map((c) => c._id);
  await Promise.all([
    StampRequest.deleteMany({ customer: { $in: custIds } }),
    StampCard.deleteMany({ customer: { $in: custIds } }),
    Customer.deleteMany({ _id: { $in: custIds } }),
    StampRequest.deleteMany({ shop: { $in: seededShops.map((s) => s._id) } }),
    StampCard.deleteMany({ shop: { $in: seededShops.map((s) => s._id) } }),
    ShopMembership.deleteMany({ user: { $in: teamUsers.map((u) => u._id) } }),
    User.deleteMany({ _id: { $in: teamUsers.map((u) => u._id) } }),
    Invite.deleteMany({ email: new RegExp(`@${TEAM_DOMAIN.replace(/\./g, "\\.")}$`) }),
  ]);
  if (wipe) {
    await ShopMembership.deleteMany({ shop: { $in: seededShops.map((s) => s._id) } });
    await Shop.deleteMany({ _id: { $in: seededShops.map((s) => s._id) } });
    await Subscription.deleteMany({ stripeSubscriptionId: SEED_SUB });
    console.log("Wiped the seeded shops, customers, stamps, team and subscription.");
    await mongoose.disconnect();
    return;
  }

  // ── Plan: Max (10 shops) ──────────────────────────────────────────────
  const periodStart = new Date();
  const periodEnd = new Date(Date.now() + 30 * 86_400_000);
  const existingSub = await Subscription.findOne({ shop: main._id });
  if (existingSub && existingSub.stripeSubscriptionId !== SEED_SUB) {
    console.log(`"${main.name}" already has a real subscription (${existingSub.planSlug}); leaving it alone.`);
  } else {
    await Subscription.updateOne(
      { shop: main._id },
      {
        $set: {
          shop: main._id,
          provider: "stripe",
          stripeAccount: "main",
          stripeSubscriptionId: SEED_SUB,
          planSlug: "max",
          planLabel: "Max",
          interval: "month",
          currency: "usd",
          priceCents: 2900,
          status: "active",
          cancelAtPeriodEnd: false,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      },
      { upsert: true },
    );
    console.log(`"${main.name}" is on Max (10 shops) via ${SEED_SUB}.`);
  }

  // ── Shops ─────────────────────────────────────────────────────────────
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const shopIdByName = new Map<string, Types.ObjectId>([["MAIN", main._id], [main.name, main._id]]);
  for (const s of seededShops) shopIdByName.set(s.name, s._id);
  for (const def of NEW_SHOPS) {
    if (shopIdByName.has(def.name)) continue;
    let code = "";
    do code = Array.from({ length: 8 }, () => pick(chars.split(""))).join("");
    while (await Shop.exists({ code }));
    const shop = await Shop.create({
      name: def.name,
      owner: owner._id,
      code,
      language: "en",
      stampThreshold: 8,
      timezone: TZ,
      freeTier: DEFAULT_FREE_TIER,
    });
    await ShopMembership.create({ user: owner._id, shop: shop._id, role: "owner", acceptedAt: new Date() });
    shopIdByName.set(def.name, shop._id);
    allIds.push(shop._id);
  }
  await Shop.updateOne({ _id: main._id, timezone: { $in: [null, ""] } }, { $set: { timezone: TZ } });
  console.log(`Shops: ${new Set(allIds.map(String)).size} owned by ${OWNER_EMAIL}.`);

  // ── Customers and stamps ──────────────────────────────────────────────
  const defs = [{ name: main.name, size: 1.2, trend: 1.1 }, ...NEW_SHOPS];
  // Locals who drop into nearby shops too: 2–3 shops each.
  const roamers = Array.from({ length: 70 }, () => ({
    shops: [...new Set([pick(defs), pick(defs), Math.random() < 0.4 ? pick(defs) : null].filter(Boolean))] as typeof defs,
  })).filter((r) => r.shops.length > 1);

  const customers: { cookieId: string; name?: string; email?: string }[] = [];
  const visits: { custIdx: number; shop: string; perShop: number }[] = [];
  const addCustomer = () => {
    const named = Math.random() < 0.45;
    const name = named ? `${pick(FIRST)} ${pick(LAST)}.` : undefined;
    customers.push({
      cookieId: cookieId(),
      name,
      email: named && Math.random() < 0.4 ? `${name!.split(" ")[0].toLowerCase()}${randInt(1, 999)}@example.com` : undefined,
    });
    return customers.length - 1;
  };

  for (const def of defs) {
    const n = Math.round(110 * def.size);
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      const count = r < 0.1 ? randInt(25, 60) : r < 0.3 ? randInt(6, 20) : randInt(1, 4);
      visits.push({ custIdx: addCustomer(), shop: def.name, perShop: count });
    }
  }
  for (const r of roamers) {
    const idx = addCustomer();
    for (const def of r.shops) visits.push({ custIdx: idx, shop: def.name, perShop: randInt(2, 12) });
  }

  const custDocs = await Customer.insertMany(customers, { ordered: true });
  const defByName = new Map(defs.map((d) => [d.name, d]));
  const reqs: Record<string, unknown>[] = [];
  const cards: Record<string, unknown>[] = [];

  for (const v of visits) {
    const def = defByName.get(v.shop)!;
    const history = def.openedDaysAgo ?? DAYS;
    const shopId = shopIdByName.get(v.shop)!;
    const customer = custDocs[v.custIdx]._id;
    // A newer shop has had less time for visits.
    const count = Math.max(1, Math.round((v.perShop * history) / DAYS));
    const times = Array.from({ length: count }, () => visitAt(sampleDay(def.trend, history)))
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());

    let onCard = 0;
    let earned = 0;
    let redeemed = 0;
    for (const at of times) {
      const redeem = onCard >= 8;
      reqs.push({
        shop: shopId,
        customer,
        status: "approved",
        stampsAwarded: redeem ? 0 : 1,
        redeem,
        createdAt: at,
        updatedAt: at,
      });
      if (redeem) {
        redeemed++;
        onCard = 0;
      } else {
        onCard++;
        earned++;
      }
    }
    if (times.length) {
      cards.push({ shop: shopId, customer, stamps: onCard, totalEarned: earned, freeRedeemed: redeemed, tags: [], notes: "" });
    }
  }

  // Raw inserts keep the historical createdAt and skip the pending-request
  // expiry default.
  for (let i = 0; i < reqs.length; i += 2000) await StampRequest.collection.insertMany(reqs.slice(i, i + 2000));
  await StampCard.insertMany(cards, { ordered: false });
  console.log(`Customers: ${custDocs.length} (${roamers.length} visit 2+ shops) · stamp requests: ${reqs.length}`);

  // ── Team ──────────────────────────────────────────────────────────────
  const everyShop = [...new Set(allIds.map(String))];
  for (const t of TEAM) {
    const user = await User.create({
      name: t.name,
      email: `${t.name.split(" ")[0].toLowerCase()}@${TEAM_DOMAIN}`,
      emailVerified: new Date(),
    });
    const shopIds = t.shops === "all" ? everyShop : t.shops.map((n) => String(shopIdByName.get(n)));
    await ShopMembership.insertMany(
      shopIds.map((shop) => ({ user: user._id, shop, role: t.role, invitedBy: owner._id, acceptedAt: new Date() })),
    );
  }
  for (const n of INVITE.shops) {
    await Invite.create({
      shop: shopIdByName.get(n),
      email: INVITE.email,
      role: INVITE.role,
      token: crypto.randomBytes(24).toString("hex"),
      invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 5 * 86_400_000),
    });
  }
  console.log(`Team: ${TEAM.map((t) => `${t.name} (${t.role}, ${t.shops === "all" ? "all" : t.shops.length} shops)`).join(", ")}`);
  console.log(`Pending invite: ${INVITE.email} → ${INVITE.shops.join(", ")}`);
  console.log(`\nTeam logins have no password; use admin "view as" to see what they see.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
