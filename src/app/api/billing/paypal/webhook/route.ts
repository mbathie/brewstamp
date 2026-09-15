import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Payment, Subscription } from "@/models";
import { verifyWebhook } from "@/lib/paypal";

// PayPal → us. We don't depend on webhooks for the billing schedule (the
// cron owns that); these keep Payment records honest for money that moves
// outside our flow: refunds, disputes, and cards removed from the vault.
export async function POST(req: Request) {
  const raw = await req.text();
  let ok = false;
  try {
    ok = await verifyWebhook(req.headers, raw);
  } catch (err) {
    console.error("[PayPal webhook] verification call failed:", err);
  }
  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const event = JSON.parse(raw) as { event_type: string; resource: any };
  await connectDB();

  switch (event.event_type) {
    case "PAYMENT.CAPTURE.REFUNDED": {
      // resource = the refund; links back to the capture.
      const captureLink = (event.resource.links as Array<{ rel: string; href: string }> | undefined)?.find((l) => l.rel === "up");
      const captureId = captureLink?.href.split("/").pop();
      const cents = Math.round(parseFloat(event.resource.amount?.value ?? "0") * 100);
      if (captureId) {
        await Payment.findOneAndUpdate(
          { captureId },
          { $set: { status: "refunded" }, $inc: { refundedCents: cents } }
        );
      }
      break;
    }
    case "CUSTOMER.DISPUTE.CREATED": {
      const captureIds: string[] =
        (event.resource.disputed_transactions as Array<{ seller_transaction_id?: string }> | undefined)
          ?.map((t) => t.seller_transaction_id)
          .filter(Boolean) as string[] ?? [];
      if (captureIds.length) {
        await Payment.updateMany({ captureId: { $in: captureIds } }, { $set: { status: "disputed" } });
      }
      console.warn(`[PayPal webhook] dispute opened on ${captureIds.join(", ") || "unknown capture"}`);
      break;
    }
    case "VAULT.PAYMENT-TOKEN.DELETED": {
      // Card removed on PayPal's side — the next renewal can't succeed; clear
      // it so the cron reports NO_SAVED_CARD and emails the owner.
      const id = event.resource.id as string | undefined;
      if (id) await Subscription.updateMany({ paypalVaultId: id }, { $unset: { paypalVaultId: 1 } });
      break;
    }
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
