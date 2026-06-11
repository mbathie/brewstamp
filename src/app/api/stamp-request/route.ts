import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { StampRequest, Shop, Customer } from "@/models";
import { emailDomainAllowed, countPerkDrinksToday } from "@/lib/perk";

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
