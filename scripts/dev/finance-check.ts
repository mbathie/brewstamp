import "../../src/lib/load-env";
import mongoose from "mongoose";
import { getBrewstampFinance } from "../../src/lib/finance";
(async () => {
  const f = await getBrewstampFinance();
  const { recentTransactions, revenueByMonth, mrrByPlan, ...rest } = f;
  console.log(JSON.stringify(rest, null, 1));
  console.log("byPlan:", mrrByPlan.map((p) => `${p.plan} ${p.currency} ${p.subscriptions}×$${(p.monthlyCents / 100).toFixed(2)}`).join(" | "));
  console.log("months:", revenueByMonth.map((m) => `${m.month} ${Object.entries(m.byCurrency).map(([c, v]) => c + (v / 100).toFixed(0)).join("+")}`).join(", "));
  console.log("recent:", recentTransactions.slice(0, 3));
  await mongoose.disconnect();
})();
