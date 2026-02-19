import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard } from "@/models";
import { getOrCreateCustomer } from "@/lib/cookies";
import { notFound } from "next/navigation";
import { generateAnimalName } from "@/lib/animal-names";
import CustomerClient from "./client";

export default async function CustomerScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await connectDB();

  const shop = await Shop.findOne({ code });
  if (!shop) notFound();

  const customer = await getOrCreateCustomer();

  // Find or create stamp card for this customer + shop
  let stampCard = await StampCard.findOne({
    shop: shop._id,
    customer: customer._id,
  });

  if (!stampCard) {
    stampCard = await StampCard.create({
      shop: shop._id,
      customer: customer._id,
    });
  }

  // Find other shops this customer has visited
  const otherCards = await StampCard.find({
    customer: customer._id,
    shop: { $ne: shop._id },
  }).populate("shop", "name code logo stampThreshold");

  const otherShops = otherCards
    .filter((c: any) => c.shop) // filter out any with deleted shops
    .map((c: any) => ({
      name: c.shop.name,
      code: c.shop.code,
      logo: c.shop.logo || null,
      stamps: c.stamps,
      threshold: c.shop.stampThreshold,
    }));

  return (
    <CustomerClient
      shopCode={shop.code}
      shopName={shop.name}
      shopLogo={shop.logo || null}
      shopId={shop._id.toString()}
      customerId={customer._id.toString()}
      customerName={customer.name || null}
      animalName={generateAnimalName(customer.cookieId)}
      customerEmail={customer.email || null}
      stamps={stampCard.stamps}
      totalEarned={stampCard.totalEarned}
      freeRedeemed={stampCard.freeRedeemed}
      threshold={shop.stampThreshold}
      bgColor={shop.bgColor || "stone-800"}
      fgColor={shop.fgColor || "amber-600"}
      bgPattern={shop.bgPattern || "none"}
      otherShops={otherShops}
    />
  );
}
