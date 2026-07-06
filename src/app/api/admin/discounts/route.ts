import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { resolvePlanPriceId, getPlanBySlug, type PlanSlug } from "@/lib/plans";

const ADMIN_EMAIL = "mbathie@gmail.com";

type PlanScope = "any" | PlanSlug;
type DurationType = "once" | "forever" | "repeating";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.email === ADMIN_EMAIL;
}

// Resolve a plan slug to its Stripe product id (shared across monthly+annual
// prices) so a coupon can be restricted to that plan only.
async function productIdForPlan(slug: PlanSlug): Promise<string | null> {
  const priceId = resolvePlanPriceId(slug, "month");
  if (!priceId) return null;
  const price = await stripe.prices.retrieve(priceId);
  return typeof price.product === "string" ? price.product : price.product.id;
}

// GET: list promotion codes with their coupon details, newest first.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const codes = await stripe.promotionCodes.list({
    limit: 100,
    expand: ["data.promotion.coupon"],
  });

  const discounts = codes.data.map((pc) => {
    const coupon = pc.promotion.coupon as Stripe.Coupon;
    return {
      id: pc.id,
      code: pc.code,
      active: pc.active,
      percentOff: coupon.percent_off,
      plan: (coupon.metadata?.plan as PlanScope) || "any",
      duration: coupon.duration as DurationType,
      durationInMonths: coupon.duration_in_months,
      expiresAt: pc.expires_at,
      maxRedemptions: pc.max_redemptions,
      timesRedeemed: pc.times_redeemed,
      created: pc.created,
    };
  });

  return NextResponse.json({ discounts });
}

// POST: create a coupon (percent off, duration, optional plan restriction) and
// a customer-facing promotion code (the typed code, expiry, redemption cap).
export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const percentOff = Number(body.percentOff);
  const plan = (body.plan || "any") as PlanScope;
  const duration = (body.duration || "once") as DurationType;
  const durationInMonths = body.durationInMonths
    ? Number(body.durationInMonths)
    : undefined;
  const code = String(body.code || "").trim().toUpperCase();
  const expiresAt = body.expiresAt ? Number(body.expiresAt) : undefined; // unix seconds
  const maxRedemptions = body.maxRedemptions
    ? Number(body.maxRedemptions)
    : undefined;

  if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
    return NextResponse.json(
      { error: "Percent off must be between 1 and 100." },
      { status: 400 },
    );
  }
  if (!code || !/^[A-Z0-9]{3,40}$/.test(code)) {
    return NextResponse.json(
      { error: "Code must be 3–40 letters/numbers." },
      { status: 400 },
    );
  }
  if (plan !== "any" && !getPlanBySlug(plan)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }
  if (duration === "repeating" && (!durationInMonths || durationInMonths < 1)) {
    return NextResponse.json(
      { error: "Repeating discounts need a month count." },
      { status: 400 },
    );
  }
  if (expiresAt && expiresAt * 1000 <= Date.now()) {
    return NextResponse.json(
      { error: "Expiry must be in the future." },
      { status: 400 },
    );
  }

  // Restrict to a plan's product when scoped (covers monthly + annual prices).
  let appliesTo: Stripe.CouponCreateParams.AppliesTo | undefined;
  if (plan !== "any") {
    const productId = await productIdForPlan(plan);
    if (!productId) {
      return NextResponse.json(
        { error: `No Stripe product configured for the ${plan} plan.` },
        { status: 400 },
      );
    }
    appliesTo = { products: [productId] };
  }

  const couponParams: Stripe.CouponCreateParams = {
    percent_off: percentOff,
    duration,
    metadata: { plan },
    ...(duration === "repeating" ? { duration_in_months: durationInMonths } : {}),
    ...(appliesTo ? { applies_to: appliesTo } : {}),
  };

  try {
    const coupon = await stripe.coupons.create(couponParams);
    const promo = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code,
      ...(expiresAt ? { expires_at: expiresAt } : {}),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
    });
    return NextResponse.json({ id: promo.id, code: promo.code }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Could not create discount.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
