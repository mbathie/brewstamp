import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { activateCheckoutSession } from "@/lib/stripe-billing";

// Called by the billing page when Stripe Checkout redirects back with
// ?session_id=…, so the new plan shows straight away instead of waiting on
// the checkout.session.completed webhook (which does the same upsert and may
// arrive before or after this).
export async function POST(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (merchant.role !== "owner") {
    return NextResponse.json({ error: "Only the shop owner can manage billing." }, { status: 403 });
  }

  const { sessionId } = await req.json().catch(() => ({}));
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  // New checkouts only ever run on the main account.
  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session || session.metadata?.shopId !== merchant.shop._id.toString()) {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }
  const shopId = await activateCheckoutSession(session, "main");
  return NextResponse.json({ ok: true, activated: !!shopId, status: session.status });
}
