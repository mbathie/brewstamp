import { connectDB } from "@/lib/mongoose";
import { Subscription } from "@/models";

// Resolve a migration token to its subscription. Tokens are 32 random bytes
// (hex) minted by scripts/stripe-to-paypal-migration.ts and cleared on use,
// so a link works exactly once.
export async function subForToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  await connectDB();
  return Subscription.findOne({ migrationToken: token });
}
