// Read the kept production server logs (7 days) straight from the prod DB.
//
//   npx tsx scripts/prod-logs.ts                         # errors + warnings + 404s, last 24h
//   npx tsx scripts/prod-logs.ts --hours 72 --q paypal   # any level mentioning paypal
//   npx tsx scripts/prod-logs.ts --level http --q /api/billing --limit 200
//
// Read-only: uses PROD_MONGO from ~/.config/brewstamp/mongo-ro.env (the
// claude-brewstamp-ro user). --level all shows every level. --local reads the
// local dev database (MONGODB_URI from .env.local) instead.
import fs from "fs";
import os from "os";
import path from "path";
import { MongoClient } from "mongodb";
import { unpackLines, filterLines, type LogLine } from "../src/lib/server-log-pure";

const args = process.argv.slice(2);
const opt = (name: string, dflt: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] != null ? args[i + 1] : dflt;
};
const hours = Number(opt("hours", "24"));
const levelArg = opt("level", "error,warn,notfound");
const levels = levelArg === "all" ? [] : levelArg.split(",").map((s) => s.trim()).filter(Boolean);
const q = opt("q", "");
const limit = Number(opt("limit", "500"));

function prodUri() {
  if (args.includes("--local")) {
    require("../src/lib/load-env");
    return process.env.MONGODB_URI as string;
  }
  if (process.env.PROD_MONGO) return process.env.PROD_MONGO;
  const f = path.join(os.homedir(), ".config/brewstamp/mongo-ro.env");
  const m = fs.existsSync(f) && fs.readFileSync(f, "utf8").match(/^PROD_MONGO=["']?([^"'\n]+)/m);
  if (!m) throw new Error("No PROD_MONGO in env or ~/.config/brewstamp/mongo-ro.env");
  return m[1];
}

async function main() {
  const client = new MongoClient(prodUri());
  await client.connect();
  try {
    const col = client.db("brewstamp").collection("serverlogs");
    const since = new Date(Date.now() - hours * 3_600_000);
    const batchQuery: Record<string, unknown> = { to: { $gte: since } };
    if (levels.length) batchQuery.$or = levels.map((l) => ({ [`levels.${l}`]: { $gt: 0 } }));
    const batches = await col.find(batchQuery).sort({ to: -1 }).limit(2000).toArray();
    const out: LogLine[] = [];
    for (const b of batches) {
      out.push(...filterLines(unpackLines(b), { q, levels, since, limit: limit - out.length }));
      if (out.length >= limit) break;
    }
    console.error(
      `# ${out.length} line(s) from ${batches.length} batch(es), last ${hours}h, levels=${levels.join(",") || "all"}${q ? `, q="${q}"` : ""}, newest first`,
    );
    for (const l of out) console.log(`${l.t}  ${l.l.padEnd(8)} ${l.m}`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
