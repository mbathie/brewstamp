import { NextResponse } from "next/server";
import { getPlanBySlug, type BillingInterval, type PlanSlug } from "@/lib/plans";
import { captureOrder, captureOf, getOrder, PayPalError, threeDsVerdict, withVaultId } from "@/lib/paypal";
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
    // The card is saved on capture, sometimes a moment after the response:
    // wait for its id so the subscription can renew (see withVaultId).
    // A failed or rejected 3-D Secure check means the bank couldn't verify the
    // cardholder: don't take the money.
    const tds = threeDsVerdict(pre);
    console.log(`[PayPal] capture check shop=${shopId} order=${body.orderId} ${tds.summary}`);
    if (!tds.ok && pre.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Your bank couldn't verify this card. Please try again, or use a different card.", code: "3DS_FAILED" },
        { status: 402 },
      );
    }
    let order = pre.status === "COMPLETED" ? pre : await captureOrder(body.orderId);
    if (captureOf(order)?.status === "COMPLETED") order = await withVaultId(order, `capture shop=${shopId}`);
    const cap = captureOf(order);
    if (!cap || cap.status !== "COMPLETED") {
      console.warn(
        `[PayPal] capture not completed shop=${shopId} order=${body.orderId} plan=${slug}/${interval} order_status=${order.status} capture_status=${cap?.status ?? "-"} processor=${JSON.stringify((cap as any)?.processor_response ?? null)} reason=${JSON.stringify((cap as any)?.status_details ?? null)}`,
      );
      return NextResponse.json(
        {
          error:
            cap?.status === "DECLINED"
              ? "Your card was declined. Please try a different card, or ask your bank to allow online payments in US dollars."
              : `Payment not completed (${cap?.status ?? order.status})`,
        },
        { status: 402 }
      );
    }
    console.log(`[PayPal] capture ok shop=${shopId} order=${body.orderId} plan=${slug}/${interval} capture=${cap.id}`);
    const sub = await activateFromCapture({
      shopId,
      order,
      slug,
      interval,
      amountCents: priceFor(slug, interval),
    });
    return NextResponse.json({ ok: true, plan: slug, interval, currentPeriodEnd: sub?.currentPeriodEnd });
  } catch (err) {
    console.error(`[PayPal] capture failed shop=${shopId} order=${body.orderId} plan=${slug}/${interval}:`, err instanceof PayPalError ? `${err.status} issue=${err.issue} ${err.message}` : err);
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
