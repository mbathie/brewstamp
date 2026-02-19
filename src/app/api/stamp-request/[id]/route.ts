import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StampRequest, StampCard, Shop } from "@/models";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const { status, stampsAwarded, redeem } = await req.json();

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const request = await StampRequest.findById(id);
  if (!request || request.status !== "pending") {
    return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
  }

  request.status = status;
  request.expiresAt = undefined; // Prevent TTL deletion of processed requests

  if (status === "approved") {
    const stampCard = await StampCard.findOne({
      shop: request.shop,
      customer: request.customer,
    });

    if (stampCard) {
      const shop = await Shop.findById(request.shop);
      const threshold = shop?.stampThreshold || 8;

      if (redeem && stampCard.stamps >= threshold) {
        // Redeem a free drink
        stampCard.stamps -= threshold;
        stampCard.freeRedeemed += 1;
      }

      // Award stamps (can happen alongside a redeem)
      const awarded = stampsAwarded || 0;
      if (awarded > 0) {
        stampCard.stamps += awarded;
        stampCard.totalEarned += awarded;
      }
      request.stampsAwarded = awarded;

      await stampCard.save();
      await request.save();

      return NextResponse.json({
        request,
        stampCard: {
          stamps: stampCard.stamps,
          totalEarned: stampCard.totalEarned,
          freeRedeemed: stampCard.freeRedeemed,
        },
        redeemed: !!redeem,
      });
    }
  }

  await request.save();
  return NextResponse.json({ request });
}
