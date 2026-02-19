import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import QRCode from "qrcode";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qrData = `${appUrl}/s/${merchant.shop.code}`;

  const qrCodeBuffer = await QRCode.toBuffer(qrData, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return new NextResponse(new Uint8Array(qrCodeBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="brewstamp-qr-${merchant.shop.code}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
