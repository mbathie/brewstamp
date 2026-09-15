# Referral partner program

Web designers / agencies / consultants refer cafés and earn **20% of every
payment the referred shop makes for 12 months** from its first payment.
Open to any signed-in user; no approval. Paid quarterly by PayPal once a
partner is owed ≥ US$25 (manual, from the admin page).

| Piece | Where |
|---|---|
| Public explainer + CTA | `/partners` (`src/app/partners/page.tsx`), linked from the footer + sitemap |
| Partner dashboard: link, payout email, referred shops, earnings | `/dashboard/partners` |
| Admin: partners, signups, paying shops, owed/paid, "Mark paid" | `/dashboard/admin/partners` |
| Core logic | `src/lib/referrals.ts` (codes, accrual, summaries); `src/lib/referral-cookie.ts` (request-only cookie read) |
| Data | `User.referralCode / referralPartner / referralPayoutEmail / referredBy`; `ReferralEarning` (one per commissionable Payment, unique on payment) |

**Flow**
1. Partner shares `https://brewstamp.app/?ref=CODE` (code = 6 chars, e.g. `VPB74Q`).
2. `proxy.ts` sees `?ref=` on any public URL → sets `bs_ref` cookie (90 days, last click wins) → redirects to the same URL without the param.
3. Register (password) and OAuth/magic-link `createUser` both read the cookie and stamp `User.referredBy`.
4. Every paid `Payment` write (PayPal initial/renewal/upgrade, Stripe `invoice.paid` webhook) calls `recordReferralEarning(paymentId)`: if the shop owner was referred by an active partner and the payment is within 12 months of the owner's first paid payment, insert a `ReferralEarning` for 20% in the payment's currency. Idempotent on payment id.
5. Admin pays via PayPal → "Mark paid" sets `paidOutAt` on all owed rows for that partner.

Self-referral isn't enforced in code beyond the cookie; the public page states it's excluded — deny at payout if it shows up.
