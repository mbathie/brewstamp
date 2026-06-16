import type { Metadata } from "next";
import { connectDB } from "@/lib/mongoose";
import { Shop, StampCard, Customer } from "@/models";
import { getOrCreateCustomer } from "@/lib/cookies";
import { notFound } from "next/navigation";
import { generateAnimalName } from "@/lib/animal-names";
import {
  emailDomainAllowed,
  countPerkDrinksToday,
} from "@/lib/perk";
import CustomerClient from "./client";
import PerkCustomerClient from "./perk-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  await connectDB();
  const shop = await Shop.findOne({ code });

  if (!shop) {
    return { title: "Stamp Card" };
  }

  const title = `${shop.name} Loyalty Card`;
  const description = `Collect stamps and earn rewards at ${shop.name}. Powered by Brewstamp.`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${appUrl}/api/og/stamp-card?shop=${encodeURIComponent(shop.name)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        `${appUrl}/api/og/stamp-card?shop=${encodeURIComponent(shop.name)}`,
      ],
    },
    robots: { index: false },
  };
}

export default async function CustomerScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ cust?: string }>;
}) {
  const { code } = await params;
  const { cust } = await searchParams;
  await connectDB();

  const shop = await Shop.findOne({ code });
  if (!shop) notFound();

  // Dev-only impersonation: ?cust=<customerId> loads that customer's card
  // without touching cookies — used to verify the "Top customer" badge and
  // other merchant-side signals on demand. Production must never honour
  // this; otherwise anyone with a customer _id could spoof identity.
  let customer = null;
  if (cust && process.env.NODE_ENV !== "production") {
    if (/^[0-9a-fA-F]{24}$/.test(cust)) {
      customer = await Customer.findById(cust);
    }
  }
  if (!customer) {
    customer = await getOrCreateCustomer();
  }

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

  // Perk mode (employer-subsidised coffee): a different card entirely — no
  // stamp accumulation, gated by email domain and capped per day. Render the
  // dedicated client instead of the stamp card.
  if (shop.perkMode) {
    const dailyLimit = shop.dailyDrinkLimit || 2;
    const drinksToday = await countPerkDrinksToday(
      shop._id.toString(),
      customer.email,
      shop.timezone || "UTC",
    );
    const emailAllowed = emailDomainAllowed(
      customer.email,
      shop.allowedEmailDomains,
    );
    return (
      <PerkCustomerClient
        shopCode={shop.code}
        shopName={shop.name}
        shopLogo={shop.logo || null}
        shopId={shop._id.toString()}
        customerId={customer._id.toString()}
        customerEmail={customer.email || null}
        customerName={customer.name || null}
        emailAllowed={emailAllowed}
        emailVerified={!!customer.emailVerified}
        allowedDomains={shop.allowedEmailDomains || []}
        dailyLimit={dailyLimit}
        drinksToday={drinksToday}
        bgColor={shop.bgColor || "stone-800"}
        fgColor={shop.fgColor || "amber-600"}
        bgPattern={shop.bgPattern || "none"}
      />
    );
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
      customerHasPassword={!!customer.password}
      stamps={stampCard.stamps}
      totalEarned={stampCard.totalEarned}
      freeRedeemed={stampCard.freeRedeemed}
      threshold={shop.stampThreshold}
      bgColor={shop.bgColor || "stone-800"}
      fgColor={shop.fgColor || "amber-600"}
      bgPattern={shop.bgPattern || "none"}
      language={shop.language || "en"}
      otherShops={otherShops}
    />
  );
}
