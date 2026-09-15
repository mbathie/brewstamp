import { NextResponse } from "next/server";
import { getPlanBySlug, type BillingInterval, type PlanSlug } from "@/lib/plans";
import { captureOrder, captureOf, getOrder, PayPalError } from "@/lib/paypal";
import { activateFromCapture, priceFor } from "@/lib/paypal-billing";
import { paypalEnabled, requireOwner } from "../_shared";

// Step 2: the SDK approved the card (3DS done if required) — capture the
// order, vault the card, activate the plan.
// Body: { orderId, plan, interval }
export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Card billing is not enabled." }, { status: 400 });
  }
  const { merchant } = auth;

  const body = (await req.json().catch(() => ({}))) as { orderId?: string; plan?: string; interval?: string };
  const plan = getPlanBySlug(body.plan || "");
  if (!body.orderId || !plan || plan.slug === "free") {
    return NextResponse.json({ error: "Missing orderId or plan" }, { status: 400 });
  }
  const slug = plan.slug as Exclude<PlanSlug, "free">;
  const interval: BillingInterval = body.interval === "year" ? "year" : "month";
  const shopId = merchant.shop._id.toString();

  try {
    // The order must be ours: custom_id was stamped with this shop at creation.
    const pre = await getOrder(body.orderId);
    const customId = (pre as any).purchase_units?.[0]?.custom_id as string | undefined;
    if (!customId?.startsWith(`${shopId}:`)) {
      return NextResponse.json({ error: "Order does not belong to this shop" }, { status: 403 });
    }
    const order = pre.status === "COMPLETED" ? pre : await captureOrder(body.orderId);
    const cap = captureOf(order);
    if (!cap || cap.status !== "COMPLETED") {
      return NextResponse.json(
        { error: cap?.status === "DECLINED" ? "Your card was declined." : `Payment not completed (${cap?.status ?? order.status})` },
        { status: 402 }
      );
    }
    const sub = await activateFromCapture({
      shopId,
      order,
      slug,
      interval,
      amountCents: priceFor(slug, interval),
    });
    return NextResponse.json({ ok: true, plan: slug, interval, currentPeriodEnd: sub?.currentPeriodEnd });
  } catch (err) {
    console.error("[PayPal] capture failed:", err);
    if (err instanceof PayPalError) {
      const issue = err.issue;
      const friendly =
        issue === "INSTRUMENT_DECLINED" ? "Your card was declined. Try another card." :
        issue === "PAYER_ACTION_REQUIRED" ? "Your bank needs extra verification — please try again." :
        err.message;
      return NextResponse.json({ error: friendly, issue }, { status: 402 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
