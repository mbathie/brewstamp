import { connectDB } from "@/lib/mongoose";
import { Subscription } from "@/models";
import { stampySubForToken } from "@/lib/stampy-billing";
import type { StampySubscription } from "@/lib/stampy-db";

// Resolve a migration token to its subscription. Tokens are 32 random bytes
// (hex) minted by the migration scripts (or by a failed stampy renewal) and
// cleared on use, so a link works exactly once. Brewstamp subs live in our
// Mongo; legacy StampyStamp merchants live in the stampy db.
export type TokenTarget =
  | { kind: "brewstamp"; sub: any }
  | { kind: "stampy"; sub: StampySubscription };

/** One-line identity of a migration target, for the server log. */
export const who = (t: TokenTarget) =>
  t.kind === "stampy"
    ? `stampy sub=${String(t.sub._id)} merchant="${t.sub.merchantName}" <${t.sub.merchantEmail}>`
    : `brewstamp sub=${String(t.sub._id)} shop=${String(t.sub.shop)}`;

export async function targetForToken(token: string): Promise<TokenTarget | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  await connectDB();
  const sub = await Subscription.findOne({ migrationToken: token });
  if (sub) return { kind: "brewstamp", sub };
  const stampy = await stampySubForToken(token);
  if (stampy) return { kind: "stampy", sub: stampy };
  return null;
}
