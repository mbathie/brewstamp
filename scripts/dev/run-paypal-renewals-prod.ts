// One-off: run the PayPal renewal pass now (normally the 9am cron). Pass
// --shop <id> to first reactivate a specific migrated-but-canceled sub.
import "../../src/lib/load-env";
import mongoose from "mongoose";
import { Subscription } from "../../src/models";
import { runPaypalRenewals } from "../../src/lib/paypal-billing";
(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const i = process.argv.indexOf("--shop");
  if (i >= 0) {
    const sub = await Subscription.findOne({ shop: process.argv[i + 1], provider: "paypal" });
    if (!sub) throw new Error("no paypal sub for shop");
    console.log(`reactivating ${sub._id}: status ${sub.status} → active, periodEnd ${sub.currentPeriodEnd?.toISOString()}`);
    sub.status = "active"; sub.failedAttempts = 0; sub.nextAttemptAt = undefined;
    await sub.save();
  }
  const summary = await runPaypalRenewals();
  console.log(summary);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
