# Brewstamp SEO snapshots

Point-in-time pulls from Google Search Console (`sc-domain:brewstamp.app`).
Append a new row + detail block each time you snapshot. GSC has a ~2-day
reporting lag, so each window ends ~2 days before the snapshot date.

Generate with: `source ~/.config/brewstamp/gsc-oauth.env && npx tsx scripts/gsc-report.ts --days 28`
(OAuth refresh token: `~/.config/brewstamp/gsc-oauth-token.json`.)

## Summary over time

Each row is a trailing-28-day window vs the preceding 28 days.

| Snapshot | Window (28d) | Impressions | Clicks | CTR | Avg pos |
|---|---|---|---|---|---|
| 2026-07-10 | 06-10 → 07-07 | 6,294 (+65%) | 105 (+5%) | 1.7% | 15.0 |
| 2026-07-13 | 06-14 → 07-11 | 6,314 (+61%) | 96 (−16%) | 1.5% | 14.7 |
| 2026-07-15 | 06-16 → 07-13 | 6,511 (+61%) | 95 (−12%) | 1.5% | 14.5 |

**Trend:** impressions compounding (+60%+ MoM) but clicks have turned negative —
visibility is stuck on page 2 (avg pos ~15) where it doesn't convert. The click
decline is driven by the **homepage** (see 2026-07-13 note). No recommendations
actioned as of 2026-07-15, so the trend continues unchanged.

---

## 2026-07-15

- **Impressions:** 6,511 (+61%) · **Clicks:** 95 (−12%) · **CTR:** 1.5% (−1.2pp) · **Avg pos:** 14.5
- **No changes shipped** since 07-13 — homepage meta still the experiment copy (not reverted), key blog page not pushed, `/coffee-rewards-app` untouched. Numbers hold flat-to-eroding as predicted.
- Homepage `/`: still 71 clicks, pos 19.0, 2.4% CTR — unchanged (confirms the meta hasn't been touched).
- `/blog/coffee-shop-loyalty-cards`: 3,510 impr (54% of site), pos **14.8** — drifting up on its own across the three snapshots (15.7 → 15.2 → 14.8), inching toward page 1. Still 0.2% CTR. A small push (internal links / content refresh) would likely tip it over.
- `/coffee-rewards-app`: 510 impr, pos 41.6 — still broken.
- New rising long-tail: "coffeeshop loyalty program" (+457%, pos 19.3), "coffee shop loyalty program" (+443%, pos 26).

---

## 2026-07-13

- **Impressions:** 6,314 (+61% vs prior 28d) · **Clicks:** 96 (−16%) · **CTR:** 1.5% (−1.4pp) · **Avg pos:** 14.7
- Clicks turned negative vs the prior period (were +5% three days earlier). Impression growth continues but is not converting.

**Homepage meta-description CTR experiment (commit `64c5fb2`, 2026-06-13) — verdict: did not work.**

Old → new description on 2026-06-13:
- OLD: "A digital coffee loyalty card and stamp card for your cafe. Customers scan a QR code — no app, no signup — and collect stamps toward a free coffee. Free for your first 100 stamps."
- NEW: "Replace paper punch cards with a digital coffee loyalty card. Customers scan a QR code — no app, no signup — and earn a free coffee. Free to start."

Homepage `/` only, pre vs post the change:

| Period | Clicks | Impr | CTR | Avg pos |
|---|---|---|---|---|
| PRE (05-16 → 06-12) | 105 | 3,141 | 3.34% | 17.3 |
| POST (06-14 → 07-11) | 71 | 2,958 | 2.40% | 19.1 |

- Homepage clicks −32% (105→71), CTR −0.94pp (3.34%→2.40%). The experiment's goal was to *lift* CTR; CTR fell.
- **Caveat:** position also slipped ~1.9 spots (17.3→19.1), which independently depresses CTR — this is observational, not a clean A/B. But the punchier copy is not beating the old copy.
- **Likely mechanism:** the new copy dropped "stamp card" / "collect stamps", so Google bolds fewer query-matching terms in the snippet (queries like "coffee stamp card", "coffee shop loyalty cards" are high-impression).
- **Recommendation:** revert to the pre-experiment description (measurably higher CTR at 3.34%), or test a new variant that keeps "stamp card".

**Standing priorities (unchanged, none actioned yet):**
1. Homepage — revert/retest the meta description; investigate the ~2-spot ranking slip.
2. `/blog/coffee-shop-loyalty-cards` — 3,341 impr (53% of site), pos 15.2, 0.2% CTR. Push to page 1 (internal links, content refresh, title/meta). Highest single lever.
3. `/coffee-rewards-app` — 535 impr but pos 42. On-page SEO / rethink.
4. USA — #1 impression market (2,197) but 0.4% CTR; pure ranking problem, large latent upside.

**Winners holding page 1 (replicate):** `/alternatives/punchpass` (pos 4.4, 4.8% CTR), `/alternatives/square-loyalty` (6.1), `/pricing` (4.0), query "coffee loyalty card app" (pos 3.1, 12.2% CTR), `/blog/corporate-coffee-perk` (6.3).

---

## 2026-07-10

- **Impressions:** 6,294 (+65% vs prior 28d) · **Clicks:** 105 (+5%) · **CTR:** 1.7% (−1.0pp) · **Avg pos:** 15.0
- First snapshot. Diagnosis established: impressions surging but landing on page 2, so clicks flat and CTR falling.
- `/blog/coffee-shop-loyalty-cards`: 3,219 impr (51% of site), pos 15.7, 0.2% CTR — identified as the #1 lever.
- `/coffee-rewards-app`: 567 impr, pos 42 — underperformer.
- By country: USA highest impressions (2,081) but 0.6% CTR; AUS/GBR convert better. Mobile CTR (2.9%) > desktop (1.0%).
