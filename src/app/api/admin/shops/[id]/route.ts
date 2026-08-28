import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest, User, Subscription, Account } from "@/models";
import Customer from "@/models/Customer";
import { generateAnimalName } from "@/lib/animal-names";
import { resolveSub } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

// Pull this shop's Stripe payment history from its subscription's customer.
// Admin-only, live Stripe — wrapped by the caller so a Stripe hiccup never
// blocks the rest of the page. Returns null when the shop has never paid.
async function getBilling(customerId: string, subStatus: string, cancelAtPeriodEnd: boolean, currentPeriodEnd: Date | null | undefined) {
  const invoices: Array<{
    id: string;
    number: string | null;
    created: number;
    amountPaid: number;
    currency: string;
    status: string | null;
    description: string | null;
    hostedUrl: string | null;
  }> = [];
  const totalPaid: Record<string, number> = {};
  let paidCount = 0;
  let firstPaidAt: number | null = null;

  for await (const inv of stripe.invoices.list({ customer: customerId, limit: 100 })) {
    const paid = inv.amount_paid > 0;
    if (paid) {
      paidCount += 1;
      totalPaid[inv.currency] = (totalPaid[inv.currency] ?? 0) + inv.amount_paid;
      const ms = inv.created * 1000;
      if (firstPaidAt === null || ms < firstPaidAt) firstPaidAt = ms;
    }
    invoices.push({
      id: inv.id ?? "",
      number: inv.number ?? null,
      created: inv.created * 1000,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? null,
      description: inv.lines?.data?.[0]?.description ?? null,
      hostedUrl: inv.hosted_invoice_url ?? null,
    });
  }

  invoices.sort((a, b) => b.created - a.created);

  return {
    stripeCustomerId: customerId,
    status: subStatus,
    cancelAtPeriodEnd,
    currentPeriodEnd: currentPeriodEnd ?? null,
    totalPaid,
    memberSince: firstPaidAt,
    // The first paid invoice is the initial signup; everything after it is a
    // renewal (a successfully billed recurring cycle).
    renewals: Math.max(0, paidCount - 1),
    paidCount,
    invoices,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();

  const shop = await Shop.findById(id).populate("owner", "name email phone").lean();
  if (!shop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get all stamp cards with customer info. A card counts as a real customer
  // if they've earned a stamp OR redeemed a free coffee/perk — perk-mode shops
  // accrue freeRedeemed without totalEarned, so filtering on totalEarned alone
  // would hide every perk customer. Matches the admin list's definition.
  const stampCards = await StampCard.find({
    shop: id,
    $or: [{ totalEarned: { $gt: 0 } }, { freeRedeemed: { $gt: 0 } }],
  })
    .populate("customer", "name email cookieId")
    .sort({ updatedAt: -1 })
    .lean();

  // Get stamp request stats
  const [requestStats] = await StampRequest.aggregate([
    { $match: { shop: shop._id } },
    {
      $group: {
        _id: null,
        totalApproved: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },
        totalRejected: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },
        // Only approved redemptions count as a reward actually redeemed —
        // rejected/expired redeem requests shouldn't inflate the figure.
        totalRedeems: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$redeem", true] },
                  { $eq: ["$status", "approved"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalStampsAwarded: {
          $sum: { $ifNull: ["$stampsAwarded", 0] },
        },
        firstActivity: { $min: "$createdAt" },
        lastActivity: { $max: "$createdAt" },
      },
    },
  ]);

  // Get all stamp requests
  const recentRequests = await StampRequest.find({ shop: id })
    .populate("customer", "name email cookieId")
    .sort({ createdAt: -1 })
    .lean();

  // Activity by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyActivity = await StampRequest.aggregate([
    {
      $match: {
        shop: shop._id,
        status: "approved",
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        stamps: { $sum: { $ifNull: ["$stampsAwarded", 1] } },
        visits: { $sum: 1 },
        redeems: { $sum: { $cond: [{ $eq: ["$redeem", true] }, 1, 0] } },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  const activeSub = await Subscription.findOne({ shop: shop._id, status: "active" }).lean();
  const plan = activeSub ? resolveSub(activeSub as any) : null;

  // Billing / payment history — any subscription for this shop (a canceled one
  // still has a payment history worth showing). Fetched live from Stripe.
  const anySub = (activeSub ||
    (await Subscription.findOne({ shop: shop._id }).lean())) as any;
  let billing = null;
  if (anySub?.stripeCustomerId) {
    try {
      billing = await getBilling(
        anySub.stripeCustomerId,
        anySub.status,
        !!anySub.cancelAtPeriodEnd,
        anySub.currentPeriodEnd,
      );
    } catch (err) {
      console.error("[admin/shops] Stripe billing fetch failed:", err);
    }
  }

  // Determine auth methods for shop owner
  const ownerId = (shop as any).owner._id;
  const ownerDoc = await User.findById(ownerId)
    .select("hash signupReferrer signupLandingPage")
    .lean();
  const accounts = await Account.find({ userId: ownerId }).select("provider").lean();
  const authMethods: string[] = [];
  if ((ownerDoc as any)?.hash) authMethods.push("password");
  for (const acc of accounts) {
    authMethods.push((acc as any).provider);
  }
  if (authMethods.length === 0) authMethods.push("magic-link");

  const signupReferrer = (ownerDoc as any)?.signupReferrer || "";
  const signupLandingPage = (ownerDoc as any)?.signupLandingPage || "";

  return NextResponse.json({
    shop: {
      _id: (shop as any)._id,
      name: (shop as any).name,
      code: (shop as any).code,
      stampThreshold: (shop as any).stampThreshold,
      bgColor: (shop as any).bgColor,
      fgColor: (shop as any).fgColor,
      bgPattern: (shop as any).bgPattern,
      logo: !!(shop as any).logo,
      createdAt: (shop as any).createdAt,
      goLiveNudgeSent: !!(shop as any).goLiveNudgeSent,
      upgradeNudgeSent: !!(shop as any).upgradeNudgeSent,
      firstCustomerEmailSent: !!(shop as any).firstCustomerEmailSent,
      language: (shop as any).language || "en",
      owner: { ...(shop as any).owner, authMethods, signupReferrer, signupLandingPage },
      isPro: !!activeSub,
      perkMode: !!(shop as any).perkMode,
      walletPasses: !!(shop as any).walletPasses,
      planSlug: plan?.slug ?? "free",
      planLabel: plan?.label ?? "Free",
    },
    billing,
    customers: stampCards.map((sc: any) => ({
      name: sc.customer?.name || (sc.customer?.cookieId ? generateAnimalName(sc.customer.cookieId) : null),
      email: sc.customer?.email || null,
      cookieId: sc.customer?.cookieId || null,
      stamps: sc.stamps,
      totalEarned: sc.totalEarned,
      freeRedeemed: sc.freeRedeemed,
      lastVisit: sc.updatedAt,
    })),
    stats: {
      totalCustomers: stampCards.length,
      totalApproved: requestStats?.totalApproved || 0,
      totalRejected: requestStats?.totalRejected || 0,
      totalRedeems: requestStats?.totalRedeems || 0,
      totalStampsAwarded: requestStats?.totalStampsAwarded || 0,
      firstActivity: requestStats?.firstActivity || null,
      lastActivity: requestStats?.lastActivity || null,
    },
    dailyActivity,
    recentRequests: recentRequests.map((r: any) => ({
      status: r.status,
      stampsAwarded: r.stampsAwarded,
      redeem: r.redeem,
      customerName: r.customer?.name || (r.customer?.cookieId ? generateAnimalName(r.customer.cookieId) : null),
      customerEmail: r.customer?.email || null,
      createdAt: r.createdAt,
    })),
  });
}
