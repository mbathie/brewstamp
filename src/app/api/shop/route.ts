import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getCurrentShopContext } from "@/lib/shop-context";
import { isLanguage } from "@/lib/i18n";

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
  return NextResponse.json({ aggregate: false, shop: ctx.shop });
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
  const { name, stampThreshold, logo, bgColor, fgColor, bgPattern, language } =
    await req.json();

  if (name) shop.name = name;
  if (stampThreshold) shop.stampThreshold = stampThreshold;
  if (logo !== undefined) shop.logo = logo || null;
  if (bgColor !== undefined) shop.bgColor = bgColor;
  if (fgColor !== undefined) shop.fgColor = fgColor;
  if (bgPattern !== undefined) shop.bgPattern = bgPattern;
  if (language !== undefined && isLanguage(language)) shop.language = language;

  await shop.save();
  return NextResponse.json({ shop });
}
