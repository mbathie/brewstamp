import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StampRequest, Shop, Customer, StampCard } from "@/models";
import { emailDomainAllowed, countPerkDrinksToday } from "@/lib/perk";
import { getCurrentShopContext } from "@/lib/shop-context";
import { generateAnimalName } from "@/lib/animal-names";

// Only surface requests this recent — a live request the merchant missed,
// not a stale pending row a customer abandoned minutes ago.
const RECONCILE_WINDOW_MS = 2 * 60 * 1000;

// GET: pending stamp requests for the merchant's current shop. The dashboard
// calls this on load and on every socket (re)connect so a request is never
// lost just because the live WebSocket frame arrived while the merchant tab
// was idle, mid-reconnect, or hadn't re-registered after a redeploy. The
// WebSocket is the fast path; this DB read is the durable fallback.
export async function GET() {
  await connectDB();

  const ctx = await getCurrentShopContext();
  if (!ctx || !ctx.shopId) {
    return NextResponse.json({ requests: [] });
  }
  const shopId = ctx.shopId;
  const shop = ctx.shop || (await Shop.findById(shopId));

  const fresh = new Date(Date.now() - RECONCILE_WINDOW_MS);
  const pending = await StampRequest.find({
    shop: shopId,
    status: "pending",
    createdAt: { $gte: fresh },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  if (pending.length === 0) return NextResponse.json({ requests: [] });

  const customerIds = pending.map((p: any) => p.customer);
  const [customers, cards] = await Promise.all([
    Customer.find({ _id: { $in: customerIds } })
      .select("name cookieId")
      .lean(),
    StampCard.find({ shop: shopId, customer: { $in: customerIds } })
      .select("customer stamps")
      .lean(),
  ]);
  const custMap = new Map(customers.map((c: any) => [c._id.toString(), c]));
  const cardMap = new Map(cards.map((c: any) => [c.customer.toString(), c]));

  const threshold = shop?.stampThreshold || 8;
  const perk = !!shop?.perkMode;

  const requests = pending.map((p: any) => {
    const cust = custMap.get(p.customer.toString());
    const card = cardMap.get(p.customer.toString());
    return {
      requestId: p._id.toString(),
      customerId: p.customer.toString(),
      customerName:
        cust?.name?.trim() ||
        generateAnimalName(cust?.cookieId || p.customer.toString()),
      stamps: card?.stamps || 0,
      threshold,
      redeem: !!p.redeem,
      perk,
    };
  });

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  await connectDB();
  const { shopId, customerId, redeem } = await req.json();

  if (!shopId || !customerId) {
    return NextResponse.json(
      { error: "Missing shopId or customerId" },
      { status: 400 },
    );
  }

  // Perk-mode shops (employer-subsidised coffee) gate every request by email
  // domain and a per-person daily cap before it ever reaches the barista.
  const shop = await Shop.findById(shopId);
  let perkEmail: string | undefined;
  if (shop?.perkMode) {
    const customer = await Customer.findById(customerId);
    if (!emailDomainAllowed(customer?.email, shop.allowedEmailDomains)) {
      return NextResponse.json(
        {
          error: "A valid work email is required.",
          code: "DOMAIN_NOT_ALLOWED",
        },
        { status: 403 },
      );
    }
    // Domain-valid is not enough — the email must be verified, so a spoofed
    // fake@company.com can't redeem without access to the mailbox.
    if (!customer!.emailVerified) {
      return NextResponse.json(
        {
          error: "Please verify your work email first.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 },
      );
    }
    perkEmail = customer!.email.trim().toLowerCase();
    const limit = shop.dailyDrinkLimit || 2;
    // Cap by email, not the device cookie — same email on a second phone can't
    // earn a second allowance.
    const today = await countPerkDrinksToday(
      shopId,
      perkEmail,
      shop.timezone || "UTC",
    );
    if (today >= limit) {
      return NextResponse.json(
        {
          error: `Daily limit of ${limit} reached. Try again tomorrow.`,
          code: "DAILY_LIMIT_REACHED",
        },
        { status: 403 },
      );
    }
  }

  // Expire any old pending requests for this customer at this shop
  await StampRequest.updateMany(
    { shop: shopId, customer: customerId, status: "pending" },
    { status: "expired" },
  );

  const request = await StampRequest.create({
    shop: shopId,
    customer: customerId,
    // In perk mode the request is always a free-drink redemption.
    redeem: shop?.perkMode ? true : !!redeem,
    // Denormalise the work email so the daily cap can be counted by identity.
    email: perkEmail,
  });

  return NextResponse.json({ request }, { status: 201 });
}
