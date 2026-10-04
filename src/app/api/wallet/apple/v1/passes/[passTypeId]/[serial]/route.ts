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
    .select("authToken lastPushedAt createdAt")
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

  // Every change to what a pass shows goes through syncWalletPasses, which
  // stamps lastPushedAt. Wallet sends If-Modified-Since with the Last-Modified
  // we gave it, and logs an error when we ignore it and resend an unchanged
  // pass, so answer 304 when nothing changed since then. HTTP dates have
  // second precision, hence the flooring.
  const modifiedAt = new Date(pass.lastPushedAt || pass.createdAt || Date.now());
  const modifiedSec = Math.floor(modifiedAt.getTime() / 1000);
  const ims = Date.parse(req.headers.get("if-modified-since") || "");
  if (!Number.isNaN(ims) && Math.floor(ims / 1000) >= modifiedSec) {
    return new Response(null, { status: 304 });
  }

  console.log(`[Wallet/apple] refresh: serving latest pass serial=${serial}`);
  const buf = await pkpassForSerial(serial);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": new Date(modifiedSec * 1000).toUTCString(),
      "Cache-Control": "no-store",
    },
  });
}
