import { connectDB } from "@/lib/mongoose";
import { Shop } from "@/models";

// Public endpoint that serves a shop's logo as a real image. Shop logos are
// stored as data: URIs, but Apple/Google Wallet (and other consumers) need a
// fetchable image URL — Google fetches programLogo server-side. This decodes
// the stored data URI and returns the raw image. Read-only and non-sensitive
// (a logo is already shown on the public customer card).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await connectDB();
  const shop = await Shop.findById(id).select("logo").lean<any>();
  const logo: string | undefined = shop?.logo;
  if (!logo) return new Response("Not found", { status: 404 });

  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(logo);
  if (m) {
    const buf = Buffer.from(m[2], "base64");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": m[1],
        "Cache-Control": "public, max-age=300",
      },
    });
  }
  // Already a URL → redirect to it.
  if (/^https?:\/\//i.test(logo)) return Response.redirect(logo, 302);
  return new Response("Not found", { status: 404 });
}
