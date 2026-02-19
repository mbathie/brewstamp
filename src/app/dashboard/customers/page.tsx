import { connectDB } from "@/lib/mongoose";
import { getMerchant } from "@/lib/auth";
import { StampCard } from "@/models";
import { redirect } from "next/navigation";
import CustomerSearch from "@/components/customer-search";

export default async function CustomersPage() {
  const merchant = await getMerchant();
  if (!merchant) redirect("/login");

  const { shop } = merchant;
  await connectDB();

  const stampCards = await StampCard.find({ shop: shop._id })
    .populate("customer", "name cookieId email")
    .sort({ updatedAt: -1 });

  const serialized = JSON.parse(JSON.stringify(stampCards));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Customers</h1>
      <CustomerSearch stampCards={serialized} threshold={shop.stampThreshold} />
    </div>
  );
}
