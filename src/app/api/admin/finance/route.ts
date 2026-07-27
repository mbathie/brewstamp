import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getBrewstampFinance } from "@/lib/finance";

// Live Stripe aggregation — never cache.
export const dynamic = "force-dynamic";

function parseDate(v: string | null): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  // `to` is inclusive of the whole day, so push to end-of-day.
  const toRaw = parseDate(searchParams.get("to"));
  const to = toRaw ? new Date(toRaw.getTime() + 24 * 60 * 60 * 1000 - 1) : undefined;

  try {
    const data = await getBrewstampFinance({ from, to });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load finance data", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
