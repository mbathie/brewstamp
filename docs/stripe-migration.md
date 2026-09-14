# Stripe account migration — runbook

Moving Brewstamp off the shared Stripe account (`acct_1L5MPrHxHWKx0vW1`, dashboard name
"tippytip", shared with tippytip and stampystamp) to its own account
(`acct_1UFi5XIiYU2twPgk`, "Brewstamp", AU/AUD).

**Only brewstamp-app changes.** tippytip and stampystamp stay on the old account and its key.

## Status

| Step | State |
|---|---|
| 1. New account verified — live, charges enabled, was empty | done 2026-09-15 |
| 2. Products, prices, coupons, webhook recreated in new account | done 2026-09-15 |
| 3. Inventory of the 10 live subscriptions | done, `~/.config/brewstamp/stripe-migration-inventory.json` |
| 4. Copy customers + payment methods (self-serve in Dashboard) | **waiting on you — see below** |
| 5. Rebuild subscriptions in new account, cancel old at period end | `scripts/stripe-migrate-subscriptions.ts` |
| 6. Switch brewstamp-app env vars on DigitalOcean | after 5 |
| 7. Verify, then retire old webhook | after 6 |

## Step 4 — copy the customers and cards (self-serve, ~minutes to hours)

This is **self-serve in the Dashboard** — no support ticket. Stripe's docs:
[Copy PAN data across Stripe accounts](https://docs.stripe.com/get-started/data-migrations/pan-copy-self-serve).

From the **old** account's dashboard (named "tippytip"): Settings → Data migrations →
*Copy PAN data* → recipient `acct_1UFi5XIiYU2twPgk` → **partial copy, select customers**
(under 15, so no CSV needed) → pick exactly the 10 customer ids in the inventory JSON. The
account is shared, so do not run a full copy.

What happens: Customer objects and their payment methods are copied. **Customer ids are
preserved**; payment-method ids are new. Subscriptions are *not* copied. Stripe drops a
mapping CSV (`customer_id_old, source_id_old, customer_id_new, source_id_new`) into the
recipient account's Documents section when done.

**Known gap:** 3 of the 10 pay via **Link** (emilykindland, sungatullina, xocohousecorp).
Card payment methods copy cleanly; Link wallets may not. The rebuild script skips any
customer that arrives without a payment method and names them, so you'll know exactly
who (if anyone) needs to re-enter a card. The other 7 are plain cards.

Accounts are rate-limited on how many copies they can run; a second copy between the
same pair only adds customers/methods not already present, so a missed customer can be
picked up without duplicating the rest.

## Step 5 — rebuild

```
# dry run: prints exactly what would happen, changes nothing
# (--mapping is optional: customer ids survive the copy, so identity is assumed
#  and every customer is verified in the new account before use)
npx tsx scripts/stripe-migrate-subscriptions.ts --mapping ~/Downloads/mapping.csv

# apply: create in new account, cancel old at period end, repoint Mongo
# (needs a read-write Mongo user — see memory note "One-off prod Mongo writes via DO MCP")
MONGODB_URI='<rw uri>' npx tsx scripts/stripe-migrate-subscriptions.ts --mapping ~/Downloads/mapping.csv --apply
```

Each new subscription is created with `billing_cycle_anchor` = the old subscription's
next renewal and `proration_behavior: none`, so **no one is charged at creation** and the
first new-account invoice lands on the day the old one would have. The old subscription
is set to cancel at period end. Because customer ids are preserved, the Mongo update
only touches `stripeSubscriptionId` / `stripePriceId`; `stripeCustomerId` stays valid. Legacy $5 USD subscribers are rebuilt on the recreated
$5 price (grandfathered), not moved to $7. Coupons carry over (same ids in both accounts).

Re-runnable: already-migrated subscriptions are detected and skipped.

## Step 6 — DigitalOcean env vars (brewstamp-app only)

Do this **after** step 5, not before: the same key drives the billing portal, receipts
and the finance page for the existing 10 subscribers. Switching first would break all of
that for them until the rebuild ran.

| Var | New value |
|---|---|
| `STRIPE_SECRET_KEY` | from `~/.config/brewstamp/stripe-new.env` (`STRIPE_SECRET_KEY_NEW`) — set as SECRET |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_51UFi5XIiYU2twPgkDnR2m4RyZSRqsfe2XqWZHdut2UHqmhEdR11aNHNsahLYDi16LiWeUyW6nPdeD8X7ZMZ8TBaZ00tIC1ept8` |
| `STRIPE_WEBHOOK_SECRET` | from `stripe-new.env` (`STRIPE_WEBHOOK_SECRET_NEW`) — set as SECRET |
| `STRIPE_PRICE_PRO` | `price_1UFiJvIiYU2twPgkY0hLLlZ0` (USD 7/mo) |
| `STRIPE_PRICE_PLUS` | `price_1UFiJsIiYU2twPgksjI3pcj6` (USD 19/mo) |
| `STRIPE_PRICE_MAX` | `price_1UFiJqIiYU2twPgkIFrwrzXd` (USD 29/mo) |
| `STRIPE_PRICE_PRO_ANNUAL` | `price_1UFiJuIiYU2twPgk8sKd4TYL` |
| `STRIPE_PRICE_PLUS_ANNUAL` | `price_1UFiJsIiYU2twPgkqmX3E0Nb` |
| `STRIPE_PRICE_MAX_ANNUAL` | `price_1UFiJqIiYU2twPgkzuO7NiRR` |
| `STRIPE_PRICE_ID` (legacy) | `price_1UFiJwIiYU2twPgk7NwrS36U` (USD 5/mo) |
| `STRIPE_REFERRAL_COUPON_ID` | unchanged — `REFERRAL_1MO_FREE` exists in both accounts |

The AUD prices are resolved by the app from the same products (lookup in `@/lib/plans`);
the full old→new map for all 13 prices is in the inventory JSON under `priceMap`.

Also update `~/.config/brewstamp/stripe-live.env` is **not** touched — that file is the
shared old-account key, still needed for stampystamp/tippytip work. Local `.env.local`
for brewstamp should switch to the new key at the same time as DO.

## Step 7 — verify and retire

- `/dashboard/admin/finance` shows 10 active subscriptions and MRR $76 from the new account.
- Open the billing portal as one migrated shop (admin "view as" → Billing) — it must load.
- Stripe dashboard (new account) → Developers → Webhooks → the brewstamp endpoint shows
  successful deliveries. Deliveries that failed signature checks before the env switch
  are retried automatically for 3 days.
- After the last old-account renewal date in the inventory has passed (~2026-10-14), confirm
  in the old account that all 10 old subscriptions are `canceled` and no Brewstamp invoice
  was raised after its migration date. Then disable the old brewstamp webhook endpoint.

## Rolling back (before step 6)

Nothing on production references the new account until step 6. To abandon: delete the
subscriptions created in the new account and clear `cancel_at_period_end` on the old ones
(the script records `migrated_to` / `migrated_from_*` metadata on both sides to find them).
