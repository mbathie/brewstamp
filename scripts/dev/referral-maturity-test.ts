import "../../src/lib/load-env";
import mongoose from "mongoose";
import { Payment, ReferralEarning, Shop, User } from "../../src/models";
import { bucketEarnings, enrolPartner, recordReferralEarning, reverseReferralEarning } from "../../src/lib/referrals";
(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const me = await User.findOne({ email: "mbathie@gmail.com" });
  await enrolPartner(String(me._id));
  await User.deleteMany({ email: "referred-test@example.com" });
  const ref = await User.create({ name: "Referred Test", email: "referred-test@example.com", referredBy: me._id });
  await Shop.deleteMany({ name: "Referred Test Cafe" });
  const shop = await Shop.create({ name: "Referred Test Cafe", owner: ref._id, code: "REFTEST1" });
  const d = (days: number) => new Date(Date.now() - days * 86400_000);
  const old = await Payment.create({ shop: shop._id, provider: "paypal", paidAt: d(90), kind: "initial", status: "paid", amountCents: 1900, currency: "usd" });
  const mid = await Payment.create({ shop: shop._id, provider: "paypal", paidAt: d(61), kind: "renewal", status: "paid", amountCents: 1900, currency: "usd" });
  const fresh = await Payment.create({ shop: shop._id, provider: "paypal", paidAt: d(5), kind: "renewal", status: "paid", amountCents: 1900, currency: "usd" });
  for (const p of [old, mid, fresh]) await recordReferralEarning(p._id);
  let b = bucketEarnings(await ReferralEarning.find({ partner: me._id }).lean());
  console.log("before reversal → payable", b.payable, "pending", b.pending, "(expect 7.60 payable, 3.80 pending)");
  // Pay out, then the 90-day-old payment gets charged back
  await ReferralEarning.updateMany({ partner: me._id, payment: { $in: [old._id, mid._id] } }, { $set: { paidOutAt: new Date() } });
  await reverseReferralEarning(old._id, "disputed");
  b = bucketEarnings(await ReferralEarning.find({ partner: me._id }).lean());
  console.log("after payout + chargeback → paid", b.paid, "clawback", b.clawback, "net", b.net, "(expect paid 3.80, clawback 3.80, net −3.80)");
  // cleanup
  await ReferralEarning.deleteMany({ shop: shop._id }); await Payment.deleteMany({ shop: shop._id }); await Shop.deleteOne({ _id: shop._id }); await User.deleteOne({ _id: ref._id });
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
