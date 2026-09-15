// Dev-only: give the local sample stampy merchant the sandbox vault card from
// the Brewstamp test sub, back-date its period, and run the stampy renewal.
import "../../src/lib/load-env";
import mongoose from "mongoose";
import { Subscription } from "../../src/models";
import { stampyCollections } from "../../src/lib/stampy-db";
import { runStampyRenewals } from "../../src/lib/stampy-billing";
(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const bs = await Subscription.findOne({ provider: "paypal", paypalVaultId: { $exists: true } });
  const { subscriptions, payments } = await stampyCollections();
  const end = new Date(Date.now() - 3600_000);
  await subscriptions.updateOne(
    { merchantId: "stampy_sample_merchant" },
    { $set: { provider: "paypal", paypalVaultId: bs.paypalVaultId, paypalCustomerId: bs.paypalCustomerId, card: bs.card, migratedAt: new Date(), currentPeriodStart: new Date(end.getTime() - 30 * 86400_000), currentPeriodEnd: end, status: "active", failedAttempts: 0, nextAttemptAt: null } }
  );
  const summary = await runStampyRenewals();
  const after = await subscriptions.findOne({ merchantId: "stampy_sample_merchant" });
  console.log("summary:", summary);
  console.log("after:", after!.status, after!.currentPeriodStart?.toISOString().slice(0, 10), "→", after!.currentPeriodEnd?.toISOString().slice(0, 10));
  const rows = await payments.find({ merchantId: "stampy_sample_merchant" }).toArray();
  console.log(rows.map((p) => `${p.kind} ${p.status} ${p.currency.toUpperCase()} ${(p.amountCents / 100).toFixed(2)} cap ${p.captureId?.slice(0, 6)}`));
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
