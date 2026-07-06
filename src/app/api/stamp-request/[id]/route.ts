import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StampRequest, StampCard, Shop, Subscription, User } from "@/models";
import { sendFirstCustomerEmail } from "@/lib/email";
import { countPerkDrinksToday } from "@/lib/perk";
import { syncWalletPasses } from "@/lib/wallet";
import { requireMerchant, unauthorized } from "@/lib/api-auth";

// GET: the current status of a single request. The customer card polls this
// while "waiting" so a resolved request (approved/rejected) is never missed if
// the live WebSocket frame was dropped (idle tab, reconnect, redeploy).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const request = await StampRequest.findById(id).lean();
  if (!request) {
    // TTL may have swept an expired pending row — treat as no longer actionable.
    return NextResponse.json({ status: "expired" });
  }

  const payload: any = {
    status: request.status,
    stampsAwarded: request.stampsAwarded ?? 0,
    redeemed: !!request.redeem,
  };

  if (request.status === "approved") {
    const stampCard = await StampCard.findOne({
      shop: request.shop,
      customer: request.customer,
    }).lean();
    if (stampCard) {
      payload.stampCard = {
        stamps: stampCard.stamps,
        totalEarned: stampCard.totalEarned,
        freeRedeemed: stampCard.freeRedeemed,
      };
    }
  }

  return NextResponse.json(payload);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Approving a request mints stamps / redeems free drinks — it must be an
  // authenticated merchant acting on their OWN shop, not anyone with the id.
  const merchant = await requireMerchant();
  if (!merchant) return unauthorized();

  await connectDB();

  const { status, stampsAwarded, redeem } = await req.json().catch(() => ({}));

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const request = await StampRequest.findById(id);
  if (!request || request.status !== "pending") {
    return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
  }
  if (!merchant.shopIds.includes(request.shop.toString())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

      // Perk mode: every approval is a free drink, with no stamp accumulation.
      // Re-check the daily cap here so two devices (or a stale tab) can't
      // approve past the limit even if the customer-side gate was bypassed.
      if (shop?.perkMode) {
        const limit = shop.dailyDrinkLimit || 2;
        // Recheck by email (the cap's identity), so two devices sharing one
        // work email can't both be approved past the limit.
        const today = await countPerkDrinksToday(
          request.shop.toString(),
          request.email,
          shop.timezone || "UTC",
        );
        if (today >= limit) {
          return NextResponse.json(
            { error: `Daily limit of ${limit} reached.`, code: "DAILY_LIMIT_REACHED" },
            { status: 403 },
          );
        }
        // Atomically claim the request so two concurrent approvals can't both
        // redeem (the loser gets 409 and awards nothing).
        const claimed = await StampRequest.updateOne(
          { _id: id, status: "pending" },
          { $set: { status: "approved" }, $unset: { expiresAt: 1 } },
        );
        if (claimed.modifiedCount !== 1) {
          return NextResponse.json(
            { error: "Request already processed", code: "ALREADY_PROCESSED" },
            { status: 409 },
          );
        }
        stampCard.freeRedeemed += 1;
        request.stampsAwarded = 0;
        request.redeem = true;
        await stampCard.save();
        await request.save();
        // Push the new balance to any wallet passes (no-op if none / unconfigured).
        void syncWalletPasses(stampCard._id.toString());
        return NextResponse.json({
          request,
          stampCard: {
            stamps: stampCard.stamps,
            totalEarned: stampCard.totalEarned,
            freeRedeemed: stampCard.freeRedeemed,
          },
          redeemed: true,
          perk: true,
        });
      }

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

      // Atomically claim the request before mutating the balance, so two
      // concurrent approvals can't both award (the loser gets 409).
      const claimed = await StampRequest.updateOne(
        { _id: id, status: "pending" },
        { $set: { status: "approved" }, $unset: { expiresAt: 1 } },
      );
      if (claimed.modifiedCount !== 1) {
        return NextResponse.json(
          { error: "Request already processed", code: "ALREADY_PROCESSED" },
          { status: 409 },
        );
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
      // Push the new balance to any wallet passes (no-op if none / unconfigured).
      void syncWalletPasses(stampCard._id.toString());

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
