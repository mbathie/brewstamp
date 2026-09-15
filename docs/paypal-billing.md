# PayPal card billing — how it works and how to go live

Brewstamp bills through **PayPal Advanced Credit and Debit Card Payments**
on the US business account (`uspaypal@bathie.me`). Customers enter a card
inline on `/dashboard/billing` (no redirect, no PayPal account). PayPal
holds the card in its vault; **we own the subscription schedule** — the
daily cron charges the vault when a period ends.

Stripe stays wired in for the shops that still bill there (`provider:
"stripe"` on their Subscription doc). `BILLING_PROVIDER` decides which
provider a *new* checkout uses.

## Moving parts

| Piece | Where |
|---|---|
| REST client (OAuth, orders, vault charge, setup/payment tokens, webhook verify) | `src/lib/paypal.ts` |
| Subscription engine (activate, plan switch/proration, renewals, dunning, receipts) | `src/lib/paypal-billing.ts` |
| Daily run (9am AEDT, with the Stripe overdue pass) | `src/lib/billing-cron.ts` → `runBilling()` |
| Customer routes | `src/app/api/billing/paypal/{order,capture,setup-token,payment-token,webhook}` |
| Provider-aware existing routes | `src/app/api/billing/{route,switch,portal,resend-receipt}.ts` |
| Inline card form (PayPal Card Fields) | `src/components/paypal-card-fields.tsx` |
| Billing page (side-sheet checkout, update card, history) | `src/app/dashboard/billing/page.tsx` |
| Data | `Subscription` (provider, planSlug, interval, paypalVaultId, card, dunning fields), `Payment` (one row per charge attempt) |
| Finance + admin shop view read both providers | `src/lib/finance.ts`, `src/app/api/admin/shops/[id]/route.ts` |

## Flows

**New subscription** — `POST /order` creates a PayPal order for the plan
price with `vault.store_in_vault: ON_SUCCESS`; the SDK collects the card
and runs 3DS if the issuer asks; `POST /capture` captures it, stores the
vault id + card summary, sets the period (now → +1 month/year), writes a
`Payment{kind: initial}` and emails the receipt.

**Renewal (cron)** — for every PayPal sub with `currentPeriodEnd <= now`:
apply a pending downgrade, charge `price − creditCents` against the vault
as a merchant-initiated `RECURRING/SUBSEQUENT` transaction with an
idempotency key (`renewal-<sub>-<periodEnd>-<attempt>`), roll the period,
write `Payment{kind: renewal}`, email the receipt.

**Dunning** — a decline marks the sub `past_due`, records a failed
`Payment`, emails "payment didn't go through", and retries on the schedule
`RETRY_OFFSETS_DAYS = [0, 3, 7]` (days after the due date). After the 3rd
failure the sub is `canceled`, the shop drops to Free, and the existing
downgrade email goes out. Updating the card while past-due pulls the next
attempt forward to the next cron run.

**Plan changes** (`/api/billing/switch`, provider = paypal):
- upgrade, or monthly → annual: credit the unused fraction of the current
  period, charge the difference now, start a fresh period today
- downgrade, or annual → monthly: takes effect at renewal (`pendingPlanSlug`)
- → Free: `cancelAtPeriodEnd`; clicking the current plan again resumes

**Update card** — vault setup token → Card Fields → payment token; the old
token is deleted. No charge.

**Webhooks** (`/api/billing/paypal/webhook`, needs `PAYPAL_WEBHOOK_ID`):
refunds and disputes update `Payment.status`; a vault token deleted on
PayPal's side clears `paypalVaultId` so the next renewal fails cleanly.

## Env

| Var | Purpose |
|---|---|
| `BILLING_PROVIDER` | `paypal` or `stripe` — which provider new checkouts use |
| `PAYPAL_ENV` | `sandbox` or `live` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | REST app credentials (server) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | same client id, for the JS SDK |
| `PAYPAL_WEBHOOK_ID` | id of the webhook registered for the live app |

Credentials for both environments live in `~/.config/brewstamp/paypal.env`
(chmod 600). Local `.env.local` carries the sandbox set.

## Sandbox testing

Any future expiry, 3-digit CVV (4 for Amex):

- Visa `4012 0000 3333 0026`, `4005 5192 0000 0004`
- Mastercard `2223 0000 4840 0011`
- Amex `3714 4963 5398 431`
- Decline: put `CCREJECT-REFUSED` / `CCREJECT-IF` in the *name* field

Cron without waiting a month: `npx tsx scripts/dev/paypal-cron-test.ts`
(back-dates the sandbox sub and runs a renewal) and
`scripts/dev/paypal-dunning-test.ts` (forces three declines, then restores).

## Going live

1. In the developer dashboard (Live → app `brewstamp` → Features) confirm
   *Advanced Credit and Debit Card Payments*, *Save payment methods* and
   *Subscriptions* are ticked (they were on creation). Account-level ACDC
   eligibility for live is granted by PayPal after onboarding; if the card
   fields report "not eligible" in live, apply under Business tools →
   Payments → Advanced card payments.
2. Add a **Live webhook** on the app pointing at
   `https://brewstamp.app/api/billing/paypal/webhook` with events
   `PAYMENT.CAPTURE.REFUNDED`, `CUSTOMER.DISPUTE.CREATED`,
   `VAULT.PAYMENT-TOKEN.DELETED`; copy its id into `PAYPAL_WEBHOOK_ID`.
3. DigitalOcean `brewstamp-app` env: `BILLING_PROVIDER=paypal`,
   `PAYPAL_ENV=live`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (SECRET),
   `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_WEBHOOK_ID`. Leave the `STRIPE_*`
   vars as they are — existing Stripe subs keep renewing through Stripe.
4. Verify with a real card on a test shop; refund it from the PayPal
   dashboard and check the webhook flips the `Payment` to `refunded`.
5. Withdraw the USD balance to the US bank on a schedule (weekly), as a
   hedge against account limitation on a non-resident US account.

## Migrating the existing Stripe subscribers

Stripe → PayPal card migration is a support-arranged PAN export (Stripe
support → PayPal/Braintree migrations team), not self-serve. Once PayPal
provides the mapping (old Stripe customer → vault token), a script should:
for each Stripe sub, set `provider: "paypal"`, `paypalVaultId`, `planSlug`,
`interval`, keep `currentPeriodEnd`, and set the Stripe sub to
`cancel_at_period_end`. The cron then takes over on the old renewal date.
Link-wallet payers (3 of 10) can't be exported and need to re-enter a card
via *Update card*. Not written yet — waits on the mapping format.
