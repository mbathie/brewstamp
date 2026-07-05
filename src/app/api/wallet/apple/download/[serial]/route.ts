import { pkpassForSerial } from "@/lib/wallet";

// Initial .pkpass download — the target of the "Add to Apple Wallet" link.
// Unauthenticated (the serial is the customer's own card link, like the browser
// card URL). Wallet opens it natively on iOS and registers via the web service.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serial: string }> },
) {
  const { serial } = await params;
  const buf = await pkpassForSerial(serial);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${serial}.pkpass"`,
      "Cache-Control": "no-store",
    },
  });
}
