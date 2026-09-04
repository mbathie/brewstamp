import { connectDB } from "@/lib/mongoose";
import { getCurrentShopContext } from "@/lib/shop-context";
import { Customer, StampCard, Shop } from "@/models";
import { redirect, notFound } from "next/navigation";
import { loadCustomerDetail } from "@/lib/customer-detail";
import CustomerDetailContent from "@/components/customer-detail-content";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getCurrentShopContext();
  if (!ctx || ctx.memberships.length === 0) redirect("/login");

  await connectDB();

  // Scope to the merchant's OWN shops. Prefer the active shop; in aggregate mode
  // (or when the customer has no card at the active shop) fall back to their most
  // recent card across the merchant's shops. No card at any owned shop → this
  // isn't the merchant's customer (prevents viewing arbitrary customers by id).
  const shopIds = ctx.memberships.map((m) => m.shopId);
  const stampCard =
    (ctx.shopId
      ? await StampCard.findOne({ shop: ctx.shopId, customer: id })
      : null) ||
    (await StampCard.findOne({
      shop: { $in: shopIds },
      customer: id,
    }).sort({ updatedAt: -1 }));
  if (!stampCard) notFound();

  const [customer, shop] = await Promise.all([
    Customer.findById(id),
    Shop.findById(stampCard.shop),
  ]);
  if (!customer || !shop) notFound();

  const props = await loadCustomerDetail(stampCard, customer, shop);
  return <CustomerDetailContent {...props} />;
}
