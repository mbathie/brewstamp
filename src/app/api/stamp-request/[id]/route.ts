import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StampRequest, StampCard, Shop, Subscription, User } from "@/models";
import { sendFirstCustomerEmail } from "@/lib/email";

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

      // Check stamp limit for non-subscribers
      const awarded = stampsAwarded || 0;
      if (awarded > 0) {
        const activeSub = await Subscription.findOne({
          shop: request.shop,
          status: "active",
        });
        if (!activeSub) {
          const [agg] = await StampCard.aggregate([
            { $match: { shop: request.shop } },
            { $group: { _id: null, total: { $sum: "$totalEarned" } } },
          ]);
          const totalStamps = agg?.total || 0;
          if (totalStamps + awarded > 100) {
            return NextResponse.json(
              { error: "Stamp limit reached. Upgrade to Pro for unlimited stamps.", code: "LIMIT_REACHED" },
              { status: 403 }
            );
          }
        }
      }

      if (redeem && stampCard.stamps >= threshold) {
        // Redeem a free drink
        stampCard.stamps -= threshold;
        stampCard.freeRedeemed += 1;
      }

      // Award stamps (can happen alongside a redeem)
      if (awarded > 0) {
        stampCard.stamps += awarded;
        stampCard.totalEarned += awarded;
      }
      request.stampsAwarded = awarded;

      await stampCard.save();
      await request.save();

      // First-customer celebration: fire once when a shop's first stamp is awarded
      if (awarded > 0 && shop && !shop.firstCustomerEmailSent) {
        const owner = await User.findById(shop.owner);
        if (owner?.email) {
          shop.firstCustomerEmailSent = true;
          await shop.save();
          // Fire-and-forget; failures shouldn't block the stamp approval
          sendFirstCustomerEmail({
            to: owner.email,
            merchantName: owner.name || owner.email.split("@")[0],
            shopName: shop.name,
          }).catch((e) =>
            console.error("[Email] first-customer send error:", e)
          );
        }
      }

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
