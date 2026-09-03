import { connectDB } from "@/lib/mongoose";
import { getCurrentShopContext } from "@/lib/shop-context";
import { Customer, StampCard, StampRequest, Shop } from "@/models";
import { redirect, notFound } from "next/navigation";
import { generateAnimalName } from "@/lib/animal-names";
import CustomerDetailContent from "@/components/customer-detail-content";

interface RawRequest {
  _id: { toString(): string };
  createdAt: Date;
  status: "approved" | "rejected";
  stampsAwarded?: number;
  redeem?: boolean;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.memberships.length === 0) redirect("/login");

  await connectDB();

  // Scope to the merchant's OWN shops. Prefer the active shop; in aggregate mode
  // (or when the customer has no card at the active shop) fall back to their most
  // recent card across the merchant's shops. No card at any owned shop → this
  // isn't the merchant's customer (prevents viewing arbitrary customers by id).
  const shopIds = ctx.memberships.map((m) => m.shopId);
  const stampCard =
    (ctx.shopId
      ? await StampCard.findOne({ shop: ctx.shopId, customer: id })
      : null) ||
    (await StampCard.findOne({
      shop: { $in: shopIds },
      customer: id,
    }).sort({ updatedAt: -1 }));
  if (!stampCard) notFound();

  const [customer, shop] = await Promise.all([
    Customer.findById(id),
    Shop.findById(stampCard.shop),
  ]);
  if (!customer || !shop) notFound();

  const requests = (await StampRequest.find({
    shop: stampCard.shop,
    customer: customer._id,
    status: { $in: ["approved", "rejected"] },
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()) as unknown as RawRequest[];

  // Engagement signals
  const approvedReqs = requests.filter((r) => r.status === "approved");
  const lastVisit = approvedReqs[0]?.createdAt?.toISOString() || null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const visitsLast30d = approvedReqs.filter(
    (r) => new Date(r.createdAt) >= thirtyDaysAgo,
  ).length;

  // Cadence: one bucket per local day for the last year, aggregated in Mongo
  // rather than derived from `requests` — that list is capped at 200 rows, which
  // would silently truncate a monthly view for a heavy customer. The client
  // rolls these days up into weeks and months.
  //
  // Mode-agnostic by construction: a stamp shop accrues `stampsAwarded` and
  // marks redemptions with `redeem`; a perk shop leaves stampsAwarded unset and
  // sets redeem on every approval, so it simply reads as rewards-only.
  const cadenceStart = new Date(now);
  cadenceStart.setDate(cadenceStart.getDate() - 364);
  cadenceStart.setHours(0, 0, 0, 0);

  const cadenceRows = await StampRequest.aggregate([
    {
      $match: {
        shop: stampCard.shop,
        customer: customer._id,
        status: "approved",
        createdAt: { $gte: cadenceStart },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: shop.timezone || "UTC",
          },
        },
        stamps: { $sum: { $ifNull: ["$stampsAwarded", 0] } },
        rewards: { $sum: { $cond: ["$redeem", 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const cadence = cadenceRows.map((r: any) => ({
    day: r._id as string,
    stamps: r.stamps as number,
    rewards: r.rewards as number,
  }));

  const memberSince = (
    stampCard?.createdAt instanceof Date
      ? stampCard.createdAt
      : new Date(stampCard?.createdAt || customer.createdAt || now)
  ).toISOString();

  const history = requests.map((r) => ({
    id: r._id.toString(),
    createdAt: new Date(r.createdAt).toISOString(),
    status: r.status,
    stampsAwarded: r.stampsAwarded || 0,
    redeem: !!r.redeem,
  }));

  return (
    <CustomerDetailContent
      shopId={shop._id.toString()}
      customerId={customer._id.toString()}
      customerName={customer.name || generateAnimalName(customer.cookieId)}
      customerRealName={customer.name || null}
      customerEmail={customer.email || null}
      stamps={stampCard?.stamps || 0}
      totalEarned={stampCard?.totalEarned || 0}
      freeRedeemed={stampCard?.freeRedeemed || 0}
      threshold={shop.stampThreshold}
      perkMode={!!shop.perkMode}
      memberSince={memberSince}
      lastVisit={lastVisit}
      visitsLast30d={visitsLast30d}
      cadence={cadence}
      perkVerifications={customer.perkVerifications || 0}
      history={history}
      initialNotes={stampCard?.notes || ""}
      initialTags={stampCard?.tags || []}
      initialDisabled={!!stampCard?.disabled}
    />
  );
}
