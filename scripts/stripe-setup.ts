import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function main() {
  // Create product
  const product = await stripe.products.create({
    name: "Brewstamp Pro",
    description: "Unlimited stamps for your coffee shop",
  });
  console.log("Created product:", product.id);

  // Create $5/month recurring price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 500,
    currency: "aud",
    recurring: { interval: "month" },
  });
  console.log("Created price:", price.id);
  console.log("\nAdd this to your .env.local:");
  console.log(`STRIPE_PRICE_ID=${price.id}`);
}

main().catch(console.error);
