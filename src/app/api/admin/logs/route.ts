import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongoose";
import { ServerLog } from "@/models";
import { unpackLines, filterLines, LEVELS, type LogLine } from "@/lib/server-log-pure";

// GET /api/admin/logs?hours=24&level=error,warn&q=paypal&limit=500
//
// The kept server logs (7 days), newest first. Admin only: lines carry paths,
// emails and whatever the app printed. Batches are skipped by their level
// counts before being decompressed, so "errors in the last 3 days" doesn't
// unzip three days of http lines.
const MAX_HOURS = 24 * 7;
const MAX_LIMIT = 2000;

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  await connectDB();

  const sp = new URL(req.url).searchParams;
  const hours = Math.min(MAX_HOURS, Math.max(1, Number(sp.get("hours")) || 24));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(sp.get("limit")) || 500));
  const q = (sp.get("q") || "").trim();
  const levels = (sp.get("level") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((l) => (LEVELS as readonly string[]).includes(l));
  const since = new Date(Date.now() - hours * 3_600_000);

  const batchQuery: Record<string, unknown> = { to: { $gte: since } };
  if (levels.length) batchQuery.$or = levels.map((l) => ({ [`levels.${l}`]: { $gt: 0 } }));

  const batches = await ServerLog.find(batchQuery).sort({ to: -1 }).limit(2000).lean<any[]>();

  const out: (LogLine & { commit: string | null })[] = [];
  let scanned = 0;
  for (const b of batches) {
    const lines = unpackLines(b);
    scanned += lines.length;
    for (const l of filterLines(lines, { q, levels, since, limit: limit - out.length })) {
      out.push({ ...l, commit: b.commit || null });
    }
    if (out.length >= limit) break;
  }

  const oldest = await ServerLog.findOne().sort({ from: 1 }).select("from").lean<any>();
  return NextResponse.json({
    lines: out,
    scanned,
    batches: batches.length,
    since,
    oldest: oldest?.from || null,
    truncated: out.length >= limit,
  });
}
