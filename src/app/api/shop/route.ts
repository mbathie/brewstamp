import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getCurrentShopContext } from "@/lib/shop-context";
import { getShopPlanLimits } from "@/lib/plan-limits";
import { isLanguage } from "@/lib/i18n";
import { normalizeDomain } from "@/lib/perk";

export async function GET() {
  const ctx = await getCurrentShopContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // "All shops" mode has no single shop to edit — tell the client to prompt
  // the user to pick one from the switcher instead of editing a stand-in.
  if (ctx.mode === "all") {
    return NextResponse.json({
      aggregate: true,
      shop: null,
      // The shops the user can drill into to edit, for the picker tiles.
      shops: ctx.memberships.map((m) => ({
        shopId: m.shopId,
        shopName: m.shopName,
        role: m.role,
      })),
    });
  }
  if (ctx.mode === "unset" || !ctx.shop) {
    return NextResponse.json({ aggregate: false, shop: null });
  }
  // Whether the shop's plan unlocks corporate perk mode (Plus & Max). The
  // settings UI uses this to gate the perk tab.
  const limits = await getShopPlanLimits(ctx.shop._id.toString());
  return NextResponse.json({
    aggregate: false,
    shop: ctx.shop,
    canUsePerkMode: limits.plan.hasPerkMode,
  });
}

export async function PATCH(req: Request) {
  const ctx = await getCurrentShopContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Editing only makes sense against a single selected shop.
  if (ctx.mode !== "single" || !ctx.shop) {
    return NextResponse.json(
      {
        error:
          "Pick a specific shop from the switcher before editing its setup.",
      },
      { status: 400 }
    );
  }

  await connectDB();
  const shop = ctx.shop;
  const {
    name,
    stampThreshold,
    logo,
    bgColor,
    fgColor,
    bgPattern,
    language,
    perkMode,
    allowedEmailDomains,
    dailyDrinkLimit,
    timezone,
  } = await req.json();

  if (name) shop.name = name;
  if (stampThreshold) shop.stampThreshold = stampThreshold;
  if (logo !== undefined) shop.logo = logo || null;
  if (bgColor !== undefined) shop.bgColor = bgColor;
  if (fgColor !== undefined) shop.fgColor = fgColor;
  if (bgPattern !== undefined) shop.bgPattern = bgPattern;
  if (language !== undefined && isLanguage(language)) shop.language = language;

  if (perkMode !== undefined) {
    // Guard the feature gate server-side: only Plus & Max can turn perk mode
    // on. Turning it off is always allowed (e.g. after a downgrade).
    if (perkMode) {
      const limits = await getShopPlanLimits(shop._id.toString());
      if (!limits.plan.hasPerkMode) {
        return NextResponse.json(
          {
            error: "Corporate perk mode requires the Plus or Max plan.",
            code: "PLAN_REQUIRED",
          },
          { status: 403 }
        );
      }
    }
    shop.perkMode = !!perkMode;
  }
  if (Array.isArray(allowedEmailDomains)) {
    shop.allowedEmailDomains = allowedEmailDomains
      .map((d: string) => normalizeDomain(String(d)))
      .filter(Boolean);
  }
  if (dailyDrinkLimit !== undefined) {
    // Clamp to a sane range; 0/blank falls back to the default of 2.
    const n = Math.floor(Number(dailyDrinkLimit));
    shop.dailyDrinkLimit = Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 2;
  }
  if (typeof timezone === "string" && timezone.trim()) {
    shop.timezone = timezone.trim();
  }

  await shop.save();
  return NextResponse.json({ shop });
}
