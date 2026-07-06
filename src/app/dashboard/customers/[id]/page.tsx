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

  // 12-week cadence: count of approved visits per week, oldest first.
  const weeklyVisits = Array(12).fill(0) as number[];
  const weekZeroStart = new Date(now);
  weekZeroStart.setHours(0, 0, 0, 0);
  weekZeroStart.setDate(weekZeroStart.getDate() - 6); // start of current week-window
  for (const r of approvedReqs) {
    const d = new Date(r.createdAt);
    const diffDays = Math.floor(
      (weekZeroStart.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );
    // diffDays >= 0 means in past, before this week
    if (diffDays < 0) {
      // current week
      weeklyVisits[11] += 1;
    } else {
      const weekIdx = 11 - 1 - Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 11) {
        weeklyVisits[weekIdx] += 1;
      }
    }
  }

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
      weeklyVisits={weeklyVisits}
      history={history}
      initialNotes={stampCard?.notes || ""}
      initialTags={stampCard?.tags || []}
      initialDisabled={!!stampCard?.disabled}
    />
  );
}
