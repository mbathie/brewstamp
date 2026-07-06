import { connectDB } from "@/lib/mongoose";
import { WalletPass } from "@/models";
import { pkpassForSerial } from "@/lib/wallet";

// PassKit web service: "Get the latest version of a pass".
// GET /v1/passes/{passTypeIdentifier}/{serialNumber}
// Wallet sends `Authorization: ApplePass <authenticationToken>`; we re-sign and
// return the current pass so the device shows the latest stamp count.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ passTypeId: string; serial: string }> },
) {
  const { serial } = await params;
  await connectDB();
  const pass = await WalletPass.findOne({ serial, provider: "apple" })
    .select("authToken")
    .lean<any>();
  if (!pass) {
    console.log(`[Wallet/apple] refresh: NO PASS serial=${serial}`);
    return new Response("Not found", { status: 404 });
  }

  const auth = req.headers.get("authorization") || "";
  if (auth !== `ApplePass ${pass.authToken}`) {
    console.log(`[Wallet/apple] refresh: AUTH FAILED serial=${serial}`);
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(`[Wallet/apple] refresh: serving latest pass serial=${serial}`);
  const buf = await pkpassForSerial(serial);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": new Date().toUTCString(),
      "Cache-Control": "no-store",
    },
  });
}
