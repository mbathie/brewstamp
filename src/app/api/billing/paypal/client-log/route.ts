import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";

// The card form's own record of what happened in the browser. PayPal's card
// iframes can refuse a payment before any call reaches our server (a merchant
// once saw "payment not allowed" and left no trace anywhere), so the form
// reports each step here and it lands in the 7-day server log
// (src/lib/server-log.ts) as a "[PayPal client]" line.
//
// Unauthenticated on purpose: the token-gated card migration page has no
// session. Never sees card data; the PayPal SDK only exposes field validity.

const EVENTS = new Set([
  "sdk_load_failed",
  "not_eligible",
  "ready",
  "submit",
  "submit_rejected",
  "card_fields_error",
  "create_order_failed",
  "approve_failed",
  "success",
]);

// Small per-IP budget so the endpoint can't be used to flood the log.
const WINDOW_MS = 60_000;
const PER_WINDOW = 30;
const hits = new Map<string, { n: number; reset: number }>();

function allowed(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n: 1, reset: now + WINDOW_MS });
    return true;
  }
  h.n += 1;
  return h.n <= PER_WINDOW;
}

const clip = (v: unknown, max = 300) => {
  if (v == null || v === "") return "-";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return (s ?? "-").replace(/\s+/g, " ").slice(0, max);
};

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (!allowed(ip)) return new NextResponse(null, { status: 204 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const event = typeof body?.event === "string" ? body.event : "";
  if (!EVENTS.has(event)) return NextResponse.json({ error: "Unknown event" }, { status: 400 });

  const merchant = await getMerchant().catch(() => null);
  const who = merchant ? `shop=${merchant.shop._id} user=${merchant.user?.email ?? "-"}` : "shop=- (no session)";

  const line =
    `[PayPal client] ${event} ${who} mode=${clip(body?.mode, 20)} plan=${clip(body?.plan, 20)}/${clip(body?.interval, 10)}` +
    ` order=${clip(body?.orderId, 40)} status=${clip(body?.status, 10)} msg=${clip(body?.message, 500)}` +
    ` shown=${clip(body?.shown, 200)} detail=${clip(body?.detail, 1500)} fields=${clip(body?.fields, 300)}` +
    ` page=${clip(body?.page, 120)} ua=${clip(req.headers.get("user-agent"), 200)}`;

  if (event === "ready" || event === "submit" || event === "success") console.log(line);
  else console.warn(line);
  return new NextResponse(null, { status: 204 });
}
