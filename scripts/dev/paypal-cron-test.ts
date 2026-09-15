import "../../src/lib/load-env";
import mongoose from "mongoose";
import { Subscription, Payment } from "../../src/models";
import { runPaypalRenewals } from "../../src/lib/paypal-billing";
(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const sub = await Subscription.findOne({ provider: "paypal" });
  // Pretend the month is up: period ended an hour ago.
  const end = new Date(Date.now() - 3600_000);
  sub.currentPeriodStart = new Date(end.getTime() - 30 * 86400_000);
  sub.currentPeriodEnd = end;
  await sub.save();
  console.log("before:", sub.status, "periodEnd", sub.currentPeriodEnd.toISOString());
  const summary = await runPaypalRenewals();
  console.log("summary:", summary);
  const after = await Subscription.findById(sub._id);
  console.log("after:", after.status, "period", after.currentPeriodStart.toISOString().slice(0, 10), "→", after.currentPeriodEnd.toISOString().slice(0, 10), "failedAttempts", after.failedAttempts);
  const pays = await Payment.find({ subscription: sub._id }).sort({ createdAt: 1 });
  console.log(pays.map((p) => `${p.kind} ${p.status} $${(p.amountCents / 100).toFixed(2)} ${p.captureId ? "cap " + p.captureId.slice(0, 6) : ""} ${p.failureReason ?? ""}`));
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
