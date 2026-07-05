import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getCurrentShopContext } from "@/lib/shop-context";
import { getShopPlanLimits } from "@/lib/plan-limits";
import { StampRequest } from "@/models";
import { isLanguage } from "@/lib/i18n";
import { normalizeDomain } from "@/lib/perk";
import { syncWalletBranding } from "@/lib/wallet";
import { uploadShopLogo } from "@/lib/spaces";

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
  // Whether the shop has real loyalty/perk activity. Switching program type on
  // a shop with history strands existing data, so the UI warns first.
  const hasActivity = !!(await StampRequest.exists({
    shop: ctx.shop._id,
    status: "approved",
  }));
  return NextResponse.json({
    aggregate: false,
    shop: ctx.shop,
    canUsePerkMode: limits.plan.hasPerkMode,
    hasActivity,
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
      { status: 400 },
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
    walletPasses,
    allowedEmailDomains,
    dailyDrinkLimit,
    timezone,
  } = await req.json();

  if (name) shop.name = name;
  if (stampThreshold) shop.stampThreshold = stampThreshold;
  if (logo !== undefined) {
    shop.logo = logo || null;
    // Mirror the logo to Spaces so wallet providers have a public URL to fetch.
    // Keep the data: URI in `logo` for the in-app card. No-ops if Spaces isn't
    // configured (logoUrl stays as-is); clears logoUrl when the logo is removed.
    if (logo && String(logo).startsWith("data:")) {
      const url = await uploadShopLogo(shop._id.toString(), logo);
      if (url) shop.logoUrl = url;
    } else if (!logo) {
      shop.logoUrl = null;
    } else if (/^https?:\/\//i.test(String(logo))) {
      shop.logoUrl = logo; // already a URL
    }
  }
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
          { status: 403 },
        );
      }
    }
    shop.perkMode = !!perkMode;
  }

  if (walletPasses !== undefined) {
    // Apple/Google Wallet passes are available on every plan (incl. Free), so
    // there's no tier gate here — the shop just opts in or out.
    shop.walletPasses = !!walletPasses;
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

  // If wallet-relevant branding changed, push it to saved Apple/Google passes
  // so existing wallets reflect the new logo/colour/name. Fire-and-forget —
  // never block or fail the settings save on a wallet API hiccup.
  const brandingChanged =
    name !== undefined ||
    logo !== undefined ||
    fgColor !== undefined ||
    bgColor !== undefined ||
    perkMode !== undefined;
  if (brandingChanged && shop.walletPasses) {
    void syncWalletBranding(shop._id.toString());
  }

  return NextResponse.json({ shop });
}
