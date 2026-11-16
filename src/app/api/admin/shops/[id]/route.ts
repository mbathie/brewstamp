import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, StampRequest, User, Subscription, Account, Payment } from "@/models";
import Customer from "@/models/Customer";
import { generateAnimalName } from "@/lib/animal-names";
import { freeTierOf, LIVE_SUB_STATUSES } from "@/lib/plans";
import { getPlanCatalog } from "@/lib/plan-catalog";

// This shop's payment history from our ledger (`payments`), whichever
// provider took the money. Returns null when the shop has never been billed.
async function getBilling(shopId: unknown, sub: any) {
  const rows = (await Payment.find({ shop: shopId }).sort({ paidAt: -1, createdAt: -1 }).lean()) as any[];
  if (rows.length === 0 && !sub) return null;
  const totalPaid: Record<string, number> = {};
  let paidCount = 0;
  let firstPaidAt: number | null = null;
  for (const p of rows) {
    if (p.status === "paid" || p.status === "refunded" || p.status === "disputed") {
      paidCount += 1;
      totalPaid[p.currency] = (totalPaid[p.currency] ?? 0) + p.amountCents;
      const ms = new Date(p.paidAt ?? p.createdAt).getTime();
      if (firstPaidAt === null || ms < firstPaidAt) firstPaidAt = ms;
    }
  }
  const method =
    sub?.provider === "paypal"
      ? `PayPal · ${sub.card?.brand ?? "card"} •••• ${sub.card?.last4 ?? "????"}`
      : sub?.stripeCustomerId ?? "—";
  return {
    stripeCustomerId: method, // label shown as "payment method" in the UI
    status: sub?.status ?? "none",
    cancelAtPeriodEnd: !!sub?.cancelAtPeriodEnd,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    totalPaid,
    memberSince: firstPaidAt,
    // The first paid row is the initial signup; everything after it is a
    // renewal (a successfully billed recurring cycle).
    renewals: Math.max(0, paidCount - 1),
    paidCount,
    invoices: rows.map((p) => ({
      id: String(p._id),
      number: p.stripeInvoiceId ? p.stripeInvoiceId.slice(-8) : p.captureId ? p.captureId.slice(-8) : null,
      created: new Date(p.paidAt ?? p.createdAt).getTime(),
      amountPaid: p.status === "failed" ? 0 : p.amountCents,
      currency: p.currency,
      status: p.status,
      description: p.description ?? null,
      hostedUrl: p.hostedUrl ?? null,
    })),
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

  // past_due still holds the plan while the renewal is retried.
  const activeSub = await Subscription.findOne({ shop: shop._id, status: { $in: LIVE_SUB_STATUSES } }).lean();
  // Free trial allowance: 50 for new shops, 100 if grandfathered.
  const freeTier = freeTierOf(shop as any);
  const plan = activeSub ? (await getPlanCatalog()).resolveSub(activeSub as any) : null;

  // Billing / payment history — any subscription for this shop (a canceled one
  // still has a payment history worth showing), from our own ledger.
  const anySub = (activeSub ||
    (await Subscription.findOne({ shop: shop._id }).lean())) as any;
  let billing = null;
  try {
    billing = await getBilling(shop._id, anySub);
  } catch (err) {
    console.error("[admin/shops] billing fetch failed:", err);
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

  // Every shop this owner has, this one included (logo excluded: it's base64).
  const ownerShops = await Shop.find({ owner: ownerId })
    .select("name code createdAt")
    .sort({ createdAt: 1 })
    .lean();
  // The main shop is the one holding the owner's paid plan (it covers the
  // rest); with no plan, the first shop they made.
  const paidOn = ownerShops.length > 1
    ? await Subscription.findOne({
        shop: { $in: ownerShops.map((s: any) => s._id) },
        status: { $in: LIVE_SUB_STATUSES },
      }).lean()
    : null;
  // No plan of its own, but the owner's plan on another shop covers it.
  const coverPlan = !activeSub && paidOn ? (await getPlanCatalog()).resolveSub(paidOn as any) : null;
  const coveredBy =
    coverPlan && paidOn
      ? {
          label: coverPlan.label,
          slug: coverPlan.slug,
          shopId: String((paidOn as any).shop),
          shopName: ownerShops.find((s: any) => String(s._id) === String((paidOn as any).shop))?.name ?? "",
        }
      : null;
  const mainShopId = String((paidOn as any)?.shop ?? ownerShops[0]?._id ?? "");

  // Per-shop figures for a multi-shop owner, so the admin can compare the
  // locations in a group without opening each one.
  const groupStats = new Map<string, { customers: number; stamps: number; stamps30: number; last: Date | null; spark: number[] }>();
  if (ownerShops.length > 1) {
    const ids = ownerShops.map((s: any) => s._id);
    const SPARK_DAYS = 14;
    const dayKeys: string[] = [];
    for (let i = SPARK_DAYS - 1; i >= 0; i--) {
      dayKeys.push(new Date(Date.now() - i * 86400e3).toISOString().slice(0, 10));
    }
    const [cardAgg, reqAgg, dayAgg] = await Promise.all([
      StampCard.aggregate([
        { $match: { shop: { $in: ids } } },
        {
          $group: {
            _id: "$shop",
            // Same "real customer" rule as the customers table above.
            customers: {
              $sum: { $cond: [{ $or: [{ $gt: ["$totalEarned", 0] }, { $gt: ["$freeRedeemed", 0] }] }, 1, 0] },
            },
          },
        },
      ]),
      StampRequest.aggregate([
        { $match: { shop: { $in: ids }, status: "approved" } },
        {
          $group: {
            _id: "$shop",
            last: { $max: "$createdAt" },
            // From approved requests, like the 30-day figure beside it (card
            // totals drift from this when a balance is adjusted by hand).
            stamps: { $sum: { $ifNull: ["$stampsAwarded", 0] } },
            stamps30: {
              $sum: { $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, { $ifNull: ["$stampsAwarded", 0] }, 0] },
            },
          },
        },
      ]),
      StampRequest.aggregate([
        {
          $match: {
            shop: { $in: ids },
            status: "approved",
            createdAt: { $gte: new Date(`${dayKeys[0]}T00:00:00Z`) },
          },
        },
        {
          $group: {
            _id: { shop: "$shop", d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
            stamps: { $sum: { $ifNull: ["$stampsAwarded", 0] } },
          },
        },
      ]),
    ]);
    for (const s of ownerShops as any[]) {
      groupStats.set(String(s._id), { customers: 0, stamps: 0, stamps30: 0, last: null, spark: dayKeys.map(() => 0) });
    }
    for (const r of cardAgg) {
      const g = groupStats.get(String(r._id));
      if (g) g.customers = r.customers;
    }
    for (const r of reqAgg) {
      const g = groupStats.get(String(r._id));
      if (g) { g.last = r.last; g.stamps = r.stamps; g.stamps30 = r.stamps30; }
    }
    for (const r of dayAgg) {
      const g = groupStats.get(String(r._id.shop));
      const i = dayKeys.indexOf(r._id.d);
      if (g && i >= 0) g.spark[i] = r.stamps;
    }
  }

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
      owner: {
        ...(shop as any).owner,
        authMethods,
        signupReferrer,
        signupLandingPage,
        shops: ownerShops
          .map((s: any) => ({
            _id: String(s._id),
            name: s.name,
            code: s.code,
            createdAt: s.createdAt,
            main: String(s._id) === mainShopId,
            ...(groupStats.get(String(s._id)) ?? {}),
          }))
          .sort((a, b) => Number(b.main) - Number(a.main)),
        mainPaid: !!paidOn,
      },
      isPro: !!activeSub,
      perkMode: !!(shop as any).perkMode,
      walletPasses: !!(shop as any).walletPasses,
      planSlug: plan?.slug ?? "free",
      coveredBy,
      planLabel: plan?.label ?? `Free trial · ${freeTier.stampLimit}`,
      freeTier: freeTier.tier,
      freeLimit: freeTier.stampLimit,
    },
    billing,
    customers: stampCards.map((sc: any) => ({
      customerId: sc.customer?._id?.toString() || null,
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
