import { connectDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/api-auth";
import { Customer, StampCard, Shop } from "@/models";
import { redirect, notFound } from "next/navigation";
import { loadCustomerDetail } from "@/lib/customer-detail";
import CustomerDetailContent from "@/components/customer-detail-content";

// The merchant's customer view, for the platform admin, scoped to one shop.
// Read-only: the write actions call merchant APIs that require membership of
// the shop, which the admin doesn't have — and support shouldn't be editing a
// merchant's customer notes anyway.
export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string; customerId: string }>;
}) {
  if (!(await requireAdmin())) redirect("/dashboard");
  const { id: shopId, customerId } = await params;

  await connectDB();
  const stampCard = await StampCard.findOne({ shop: shopId, customer: customerId });
  if (!stampCard) notFound();
  const [customer, shop] = await Promise.all([
    Customer.findById(customerId),
    Shop.findById(shopId),
  ]);
  if (!customer || !shop) notFound();

  const props = await loadCustomerDetail(stampCard, customer, shop);
  return (
    <CustomerDetailContent
      {...props}
      readOnly
      backHref={`/dashboard/admin/shops/${shopId}#customers`}
    />
  );
}
