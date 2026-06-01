import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { Customer } from "@/models";
import { getTopCustomerCards, TOP_CUSTOMER_LIMIT } from "@/lib/top-customers";

export async function GET(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(TOP_CUSTOMER_LIMIT), 10) ||
      TOP_CUSTOMER_LIMIT,
    20
  );

  await connectDB();
  const cards = await getTopCustomerCards(merchant.shop._id, limit);
  if (cards.length === 0) return NextResponse.json({ customers: [] });

  const customerIds = cards.map((c) => c.customer);
  const customers = await Customer.find({ _id: { $in: customerIds } })
    .select("name email cookieId")
    .lean<{ _id: { toString(): string }; name?: string; email?: string; cookieId: string }[]>();
  const byId = new Map(customers.map((c) => [c._id.toString(), c]));

  const result = cards.map((c, idx) => {
    const cust = byId.get(c.customer.toString());
    return {
      rank: idx + 1,
      id: c.customer.toString(),
      name: cust?.name || null,
      email: cust?.email || null,
      cookieId: cust?.cookieId || "",
      stamps: c.stamps,
      totalEarned: c.totalEarned,
      freeRedeemed: c.freeRedeemed,
      lastSeenAt: c.updatedAt,
    };
  });

  return NextResponse.json({ customers: result });
}
