import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/auth";
import { mergeCustomerInto, MergeError } from "@/lib/customer-merge";

// POST: fold a duplicate card into this customer's card at the merchant's
// current shop. Body: { sourceId } — the duplicate customer. `[id]` is the
// card being kept. Stamps, rewards, history, notes and wallet passes move over,
// and the duplicate's browser resolves to this customer from then on.
// Owners and managers only: it rewrites customer records.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (merchant.role !== "owner" && merchant.role !== "manager") {
    return NextResponse.json({ error: "Only the owner or a manager can merge cards." }, { status: 403 });
  }

  const { id } = await params;
  const { sourceId } = (await req.json().catch(() => ({}))) as { sourceId?: string };
  if (!sourceId || !/^[a-f0-9]{24}$/.test(sourceId) || !/^[a-f0-9]{24}$/.test(id)) {
    return NextResponse.json({ error: "Pick the duplicate card to merge." }, { status: 400 });
  }

  try {
    const result = await mergeCustomerInto(sourceId, id, { shopId: String(merchant.shop._id) });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof MergeError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[merge] failed:", err);
    return NextResponse.json({ error: "Couldn't merge those cards." }, { status: 500 });
  }
}
