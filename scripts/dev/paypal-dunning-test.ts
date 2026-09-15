// Dev-only: force a declined renewal on the PayPal test subscription and
// walk the dunning schedule. Restores the real vault id afterwards.
import "../../src/lib/load-env";
import mongoose from "mongoose";
import { Subscription, Payment } from "../../src/models";
import { runPaypalRenewals, MAX_ATTEMPTS } from "../../src/lib/paypal-billing";
(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const sub = await Subscription.findOne({ provider: "paypal" });
  const realVault = sub.paypalVaultId;
  sub.paypalVaultId = "0000000000000000"; // invalid → PayPal rejects
  sub.currentPeriodEnd = new Date(Date.now() - 3600_000);
  await sub.save();
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    // Each pass pretends the retry date has arrived.
    if (i > 1) { const s = await Subscription.findById(sub._id); s.nextAttemptAt = new Date(Date.now() - 1000); await s.save(); }
    const summary = await runPaypalRenewals();
    const s = await Subscription.findById(sub._id);
    console.log(`attempt ${i}:`, summary, "→ status", s.status, "failedAttempts", s.failedAttempts, "next", s.nextAttemptAt?.toISOString().slice(0, 10) ?? "-");
  }
  const fails = await Payment.countDocuments({ subscription: sub._id, status: "failed" });
  console.log("failed payment rows:", fails);
  // Restore: real vault, active, one month from now.
  const s = await Subscription.findById(sub._id);
  s.paypalVaultId = realVault; s.status = "active"; s.failedAttempts = 0; s.nextAttemptAt = undefined;
  s.currentPeriodStart = new Date(); s.currentPeriodEnd = new Date(Date.now() + 30 * 86400_000);
  await s.save();
  console.log("restored:", s.status, s.paypalVaultId.slice(0, 4) + "…");
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
