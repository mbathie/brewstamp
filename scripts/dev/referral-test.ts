import "../../src/lib/load-env";
import mongoose from "mongoose";
import { Payment, ReferralEarning, Shop, User } from "../../src/models";
import { enrolPartner, partnerSummary, recordReferralEarning } from "../../src/lib/referrals";
(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const me = await User.findOne({ email: "mbathie@gmail.com" });
  const partner = await enrolPartner(String(me._id), "mbathie@gmail.com");
  console.log("partner code", partner.referralCode);
  // Referred user + shop (as the ?ref= flow would create them)
  await User.deleteMany({ email: "referred-test@example.com" });
  const ref = await User.create({ name: "Referred Test", email: "referred-test@example.com", referredBy: me._id });
  await Shop.deleteMany({ name: "Referred Test Cafe" });
  const shop = await Shop.create({ name: "Referred Test Cafe", owner: ref._id, code: "REFTEST1" });
  await Payment.deleteMany({ shop: shop._id });
  const p1 = await Payment.create({ shop: shop._id, provider: "paypal", paidAt: new Date(), kind: "initial", status: "paid", amountCents: 1900, currency: "usd", planSlug: "plus", interval: "month" });
  const p2 = await Payment.create({ shop: shop._id, provider: "paypal", paidAt: new Date(Date.now() + 30 * 86400_000), kind: "renewal", status: "paid", amountCents: 1900, currency: "usd", planSlug: "plus", interval: "month" });
  const p3 = await Payment.create({ shop: shop._id, provider: "paypal", paidAt: new Date(Date.now() + 400 * 86400_000), kind: "renewal", status: "paid", amountCents: 1900, currency: "usd", planSlug: "plus", interval: "month" });
  for (const p of [p1, p2, p3, p1]) await recordReferralEarning(p._id); // p1 twice → idempotent
  const earnings = await ReferralEarning.find({ partner: me._id, shop: shop._id });
  console.log("earnings:", earnings.map((e) => `${e.currency} ${(e.amountCents / 100).toFixed(2)} on ${e.earnedAt.toISOString().slice(0, 10)}`), "(expect 2 rows × 3.80; the 400-day payment is outside the 12-month window)");
  const summary = await partnerSummary(String(me._id));
  console.log("summary owed:", summary.owed, "shops:", summary.shops.map((s: any) => `${s.name} paying=${s.paying} earned=${s.earnedCents}`));
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
