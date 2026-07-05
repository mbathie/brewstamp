# Brewstamp revenue snapshots

Point-in-time pulls from Stripe (live), filtered to Brewstamp products on the
shared Stripe account. Append a new row + detail block each time you snapshot.

Generate with: `STRIPE_SECRET_KEY=sk_live_… node` a Stripe summary over the
Brewstamp price IDs (Pro/Plus/Max + the legacy $5 prices).

## Summary over time

| Date | MRR | Active subs | Total collected | Notes |
|---|---|---|---|---|
| 2026-06-10 | $20.00 USD | 4 | $35.00 USD (7 payments) | All on legacy $5 USD Pro; new AUD tiers = 0 subs |

---

## 2026-06-10

- **Total collected (all time):** $35.00 USD across 7 paid invoices
- **Active subscriptions:** 4 (0 churned, 0 past-due, 0 failed)
- **MRR:** $20.00 USD · **ARR run-rate:** ~$240 USD

**Subscriptions (all on legacy "Brewstamp Pro" $5 USD/mo):**

| Customer | Since | Paid to date |
|---|---|---|
| thirty7even001@gmail.com | 2026-03-11 | $15 (3×) |
| capitalcoffeechile@gmail.com | 2026-04-23 | $10 (2×) |
| kirsty@originalfoods.co.nz | 2026-05-11 | $5 (1×) |
| xocohousecorp@gmail.com | 2026-05-22 | $5 (1×) |

**New AUD tiers (launched 2026-06-01):** Pro $7 / Plus $19 / Max $29 — **0 subscribers, $0**. All paying customers predate the new pricing and are grandfathered at $5 USD.

**Health:** no churn, no failed/past-due payments, all 4 retained since signup.
