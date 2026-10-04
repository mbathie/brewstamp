// Production memory + stability report from the 7-day server log.
//
//   npx tsx scripts/mem-report.ts            # last 24h
//   npx tsx scripts/mem-report.ts --hours 72
//
// Summarises the "[mem]" lines src/lib/server-log.ts writes every 10 minutes
// (RSS against the 512 MB instance), every boot ("Ready on" = deploy or
// crash), and any fatal "[process]" errors. Crashes leave a boot with no
// deploy before it. Read-only (PROD_MONGO from ~/.config/brewstamp/mongo-ro.env).
import fs from "fs";
import os from "os";
import { MongoClient } from "mongodb";
import { unpackLines, type LogLine } from "../src/lib/server-log-pure";

const INSTANCE_MB = 512;
const i = process.argv.indexOf("--hours");
const hours = i >= 0 ? Number(process.argv[i + 1]) : 24;

const uri =
  process.env.PROD_MONGO ||
  fs.readFileSync(os.homedir() + "/.config/brewstamp/mongo-ro.env", "utf8").match(/^PROD_MONGO=["']?([^"'\n]+)/m)?.[1];
if (!uri) throw new Error("No PROD_MONGO");

async function main() {
  const c = new MongoClient(uri!);
  await c.connect();
  try {
    const since = new Date(Date.now() - hours * 3_600_000);
    const batches = await c.db("brewstamp").collection("serverlogs").find({ to: { $gte: since } }).toArray();
    const lines: (LogLine & { commit?: string })[] = batches
      .flatMap((b) => unpackLines(b).map((l) => ({ ...l, commit: b.commit })))
      .filter((l) => new Date(l.t) >= since)
      .sort((a, b) => a.t.localeCompare(b.t));

    const mem = lines
      .filter((l) => l.m.startsWith("[mem]"))
      .map((l) => ({ t: l.t, rss: Number(l.m.match(/rss=(\d+)/)?.[1]), heap: Number(l.m.match(/heap=(\d+)/)?.[1]) }));
    const boots = lines.filter((l) => l.m.startsWith("> Ready on"));
    const fatal = lines.filter((l) => l.m.startsWith("[process]"));

    console.log(`Last ${hours}h · ${lines.length} log lines · ${mem.length} memory samples\n`);
    if (mem.length) {
      const rss = mem.map((m) => m.rss);
      const max = Math.max(...rss);
      const peak = mem.find((m) => m.rss === max)!;
      const last = mem[mem.length - 1];
      const pct = (n: number) => `${Math.round((n / INSTANCE_MB) * 100)}%`;
      console.log(`RSS   min ${Math.min(...rss)} MB · max ${max} MB (${pct(max)}) at ${peak.t} · latest ${last.rss} MB (${pct(last.rss)})`);
      console.log(`Heap  max ${Math.max(...mem.map((m) => m.heap))} MB · latest ${last.heap} MB`);
      // One sample per ~2h for the trend.
      const step = Math.max(1, Math.floor(mem.length / 12));
      console.log("Trend " + mem.filter((_, k) => k % step === 0).map((m) => `${m.t.slice(5, 16)} ${m.rss}`).join(" · "));
    } else {
      console.log("No [mem] samples yet (needs the build from 2026-10-04 onwards).");
    }
    console.log(`\nBoots: ${boots.length}`);
    for (const b of boots) {
      // The last memory sample before a boot shows how full it was going down.
      const before = mem.filter((m) => m.t < b.t).at(-1);
      console.log(`  ${b.t}  commit=${b.commit?.slice(0, 7) ?? "-"}${before ? `  last RSS before: ${before.rss} MB at ${before.t}` : ""}`);
    }
    console.log(`\nFatal process errors: ${fatal.length}`);
    for (const f of fatal.slice(-10)) console.log(`  ${f.t}  ${f.m.split("\n")[0].slice(0, 200)}`);
  } finally {
    await c.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
