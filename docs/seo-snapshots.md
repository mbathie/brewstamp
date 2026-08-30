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
| 2026-07-19 | 06-20 → 07-17 | 6,890 (+56%) | 99 (−11%) | 1.4% | 14.2 |
| 2026-07-21 | 06-22 → 07-19 | 6,930 (+47%) | 106 (−6%) | 1.5% | 13.9 |
| 2026-07-24 | 06-25 → 07-22 | 6,950 (+42%) | 107 (−7%) | 1.5% | 13.7 |
| 2026-07-27 | 06-29 → 07-26 | 6,705 (+25%) | 114 (−1%) | 1.7% | 13.3 |
| 2026-07-29 | 06-30 → 07-27 | 6,587 (+18%) | 114 (−4%) | 1.7% | 13.0 |
| 2026-08-03 | 07-04 → 07-31 | 6,762 (+13%) | 119 (−1%) | 1.8% | 12.9 |
| 2026-08-05 | 07-07 → 08-03 | 6,467 (+4%) | 122 (+8%) | 1.9% | 12.8 |
| 2026-08-06 | 07-08 → 08-04 | 6,705 (+7%) | 136 (+30%) | 2.0% | 12.8 |
| 2026-08-10 | 07-12 → 08-08 | 6,376 (−4%) | 135 (+38%) | 2.1% | 12.6 |
| 2026-08-12 | 07-13 → 08-09 | 6,563 (−2%) | 144 (+48%) | 2.2% | 12.5 |
| 2026-08-13 | 07-14 → 08-10 | 6,558 (−3%) | 152 (+57%) | 2.3% | 12.4 |
| 2026-08-15 | 07-17 → 08-13 | 6,623 (−4%) | 155 (+58%) | 2.3% | 12.3 |
| 2026-08-16 | 07-18 → 08-14 | 6,415 (−7%) | 152 (+54%) | 2.4% | 12.3 |
| 2026-08-18 | 07-20 → 08-16 | 6,287 (−9%) | 143 (+35%) | 2.3% | 12.2 |
| 2026-08-27 | 07-29 → 08-25 | 7,197 (+5%) | 161 (+36%) | 2.2% | 12.2 |
| 2026-08-31 | 08-01 → 08-28 | 8,046 (+19%) | 170 (+43%) | 2.1% | 11.6 |

**Trend:** the mid-July inflection has held and re-accelerated. Homepage meta
restored 2026-07-15 (commit 45ab3f5); since then clicks 95 → 170, avg pos 14.5
→ 11.6 (new best), and — after months flat — impressions have turned up again
(+19%). The money page `/blog/coffee-shop-loyalty-cards` finally **crossed into
the top 10** (pos 10.6) after the 08-12 content expansion. The meta-revert
experiment is closed (homepage CTR 3.8%, vs 3.34% pre-experiment baseline).
Remaining problem is still "page 1 without clicks" on head terms.

---

## 2026-08-31

- **Impressions:** 8,046 (+19%) · **Clicks:** 170 (+43%) · **CTR:** 2.1% · **Avg pos:** 11.6
- **Breakthrough: the money page cracked the top 10.** `/blog/coffee-shop-loyalty-cards` is now at pos **10.6** (from 11.3 → 12.0), **clicks 20** (from 17), **4,080 impressions** (new high, 51% of the whole site). The 08-12 content expansion has fully compounded — this page was parked at pos ~15 in July and is now knocking on the first-page result set. CTR still only 0.5%, so there's a second gear here once it's solidly top-5.
- **New highs across the board:** clicks 170, impressions 8,046, avg pos 11.6 — all the best on record. Impressions turning up (+19%) after months flat means new visibility is being *added* again, not just better-monetised.
- Homepage `/`: 124 clicks, 3.8% CTR, pos 12.9 — steady, still the #2 traffic source.
- `/coffee-rewards-app`: pos **25.9**, 4 clicks — unchanged, still stuck at ~25. This is the clear next content-expansion target (same play that just worked on the blog post).
- **"Page 1, zero clicks" head terms** (the standing snippet opportunity): "coffee shop loyalty card printing" (pos 6.3), "coffee stamp card" (pos 7.8), "loyalty card coffee shop" (pos 9.6), "loyalty cards for coffee shops" (pos 9.2) — all ranking page-1 but 0 clicks. Title/snippet rewrites are the lever.
- New ranking of note: "a cafe's punch-card promise" debuts at pos **3.7** (35 impr) — an editorial/long-tail phrase worth a glance.
- **By country:** USA still the biggest impression market (2,303) at just 0.5% CTR — the largest latent upside, a pure ranking gap. AUS converts best (47 clicks, 3.9%); GBR 15 clicks at 1.2%; PHL punching above weight (10 clicks, 3.4%).

---

## 2026-08-27

- **Impressions:** 7,197 (+5%) · **Clicks:** 161 (+36%) · **CTR:** 2.2% · **Avg pos:** 12.2
- **The blog expansion (08-12, commit be779f2) has landed** — right on the ~2-week timeline. `/blog/coffee-shop-loyalty-cards`: pos **11.3** (from 12.0), CTR **0.5%** (from 0.3%), **clicks 8 → 17 (doubled)**. It's the #1 page by impressions (3,501) and now finally earning clicks. Approaching the top-10 line.
- Clicks new high (161); impressions turned positive (+5%, first up-move in weeks). Homepage `/`: 117 clicks, 3.8% CTR, pos 13.1.
- `/coffee-rewards-app`: pos 25.7. Verdict: the content-expansion lever worked — worth repeating on other thin/near-top-10 pages.

---

## 2026-08-18

- **Impressions:** 6,287 (−9%) · **Clicks:** 143 (+35%) · **CTR:** 2.3% · **Avg pos:** 12.2
- First mild softening off the peak: clicks eased 155 → 143 over four days, impressions −9%. Avg position still improving (12.2, new best) and homepage holding (115 clicks, 3.9% CTR, pos 13.7), so it reads as normal fluctuation, not a reversal — worth watching.
- `/blog/coffee-shop-loyalty-cards`: pos **12.0**, 0.3% CTR. The 08-12 expansion now has ~6 days in-window and **still no movement** — decision point ~08-22. If flat by then, the expansion didn't push it to page 1 → pivot to the title/snippet angle.
- `/coffee-rewards-app`: pos 25.1.

---

## 2026-08-16

- **Impressions:** 6,415 (−7%) · **Clicks:** 152 (+54%) · **CTR:** 2.4% · **Avg pos:** 12.3
- CTR crossed **2.4%** and homepage `/` crossed **4.0% CTR** (123 clicks, pos 14.0) — both new highs.
- `/blog/coffee-shop-loyalty-cards`: pos **11.9**, still 0.3% CTR. The 08-12 expansion now has ~3 days in-window but **no ranking movement yet** — ~4 days post-deploy is still early (content expansions typically take 1–2 weeks to register). Keep watching to ~08-22.
- `/coffee-rewards-app`: pos 25.1. Standing gap unchanged: head terms page-1 with ~0 clicks (title/snippet problem).

---

## 2026-08-15

- **Impressions:** 6,623 (−4%) · **Clicks:** 155 (+58%) · **CTR:** 2.3% · **Avg pos:** 12.3
- New high on clicks (155); CTR/avg pos holding at their bests. Homepage `/`: **124 clicks, 3.9% CTR**, pos 14.1.
- `/blog/coffee-shop-loyalty-cards`: pos **11.9**, still 0.3% CTR. The 08-12 content expansion (commit be779f2) now has only ~1 day in-window — too early; Google hasn't fully reprocessed it. Judge from ~08-18.
- `/coffee-rewards-app`: pos 25.1. Standing gap unchanged: several head terms page-1 with ~0 clicks (title/snippet problem, not rankings).

---

## 2026-08-13

- **Impressions:** 6,558 (−3%) · **Clicks:** 152 (+57%) · **CTR:** 2.3% · **Avg pos:** 12.4
- New highs again on all three of clicks / CTR / avg pos. Impressions flat-to-down is fine — the site is converting the same visibility far better than it was a month ago.
- **Branded search is now material:** query `brewstamp` = 40 clicks (+135%), 52 impr (+117%), 76.9% CTR, pos 1.0. Stripping it out, non-branded clicks went 80 → 112 (+40%), so the lift is real and not just brand.
- Homepage `/`: **122 clicks, 3.8% CTR**, pos 14.6 — best CTR recorded, comfortably past the 3.34% pre-experiment baseline. The 07-15 meta revert is fully vindicated; consider this experiment closed.
- `/blog/coffee-shop-loyalty-cards`: 3,009 impr (46% of site), pos **11.9** — first reading under 12, but still page 2 at 0.3% CTR. **The 08-12 content expansion (commit `be779f2`) contributes zero days to this window** (window ends 08-10); earliest signal ~2026-08-16.
- `/coffee-rewards-app`: pos 24.4 (was 24.7) — grinding up from 42 in July but still far from useful.
- New page-1 entrant: query "coffee shop digital stamp card" — 50 impr from zero, pos **4.3**, but 0 clicks. Same pattern as the other head terms: ranking without earning the click.
- **The standing gap:** almost every top-25 query has 0 clicks despite positions 8–16. Ranking is no longer the only problem for a chunk of them — `coffee shop loyalty card printing` (pos 6.2), `coffee stamp card` (pos 8.6), `coffee cards loyalty` (pos 9.9), `coffee shop digital stamp card` (pos 4.3) are all page 1 with 0 clicks. That is a title/snippet problem, not a rankings problem.
- By country: USA still the biggest impression pool (1,909) at 0.9% CTR vs AUS 3.8% on 1,118 — unchanged, still the largest latent upside. Mobile CTR 3.8% vs desktop 1.6%.

**Next levers, in order:**
1. Wait for the blog expansion to land in-window (~08-16), then judge.
2. Title/meta rewrite for the page-1-but-0-click queries — the SERP snippets for `/blog/coffee-shop-loyalty-card-printing` and whatever ranks for "coffee stamp card" / "coffee shop digital stamp card" are not earning clicks despite top-10 placement.
3. `/alternatives/square-loyalty` (pos 14.6) still hasn't recovered its old page-1 spot.

---

## 2026-08-12

- **Impressions:** 6,563 (−2%) · **Clicks:** 144 (+48%) · **CTR:** 2.2% · **Avg pos:** 12.5
- New highs: clicks 144, CTR 2.2%, avg pos 12.5 — the growth keeps compounding.
- Homepage `/`: **118 clicks, 3.7% CTR**, pos 14.7 — well past its pre-experiment 3.34%.
- `/blog/coffee-shop-loyalty-cards`: pos **12.0** — right on the top-10 boundary (12.4 → 12.2 → 12.0). If it crosses, its ~3,000 impressions start converting. `/coffee-rewards-app`: pos 24.7.

---

## 2026-08-10

- **Impressions:** 6,376 (−4%) · **Clicks:** 135 (+38%) · **CTR:** 2.1% · **Avg pos:** 12.6
- CTR (2.1%) and avg position (12.6) both new bests; clicks holding at the ~135 high. Impressions dipped slightly — but with clicks up and position improving, it's converting visibility better (ranking higher for relevant queries, shedding some page-3 long-tail), a healthy trade.
- Homepage `/`: 109 clicks, 3.5% CTR, pos 15.1. `/coffee-rewards-app`: pos 24.6 (climbing).
- `/blog/coffee-shop-loyalty-cards`: pos **12.2** — still parked just outside the top 10 (~3 weeks now); the one metric not improving.

---

## 2026-08-06

- **Impressions:** 6,705 (+7%) · **Clicks:** 136 (+30%) · **CTR:** 2.0% · **Avg pos:** 12.8
- Acceleration: clicks jumped 122 → 136, CTR crossed **2.0%** for the first time. (+30% is partly a favourable comparison baseline, but absolute clicks are a genuine high.)
- Homepage `/`: **111 clicks, 3.5% CTR**, pos 15.6 — CTR now *exceeds* the pre-experiment 3.34%; the revert fully paid off and then some.
- `/blog/coffee-shop-loyalty-cards`: pos **12.2** (holding ~12, still just outside top 10). `/coffee-rewards-app`: pos 26.5.

---

## 2026-08-05

- **Impressions:** 6,467 (+4%) · **Clicks:** 122 (+8%) · **CTR:** 1.9% · **Avg pos:** 12.8
- **Best read of the series — clicks AND CTR both positive** for the first time (clicks +8%, CTR +0.1pp). The full recovery from the June meta regression is complete and now compounding.
- Homepage `/`: pos **15.7** (from 16.4), 99 clicks, 3.2% CTR — durable recovery.
- `/blog/coffee-shop-loyalty-cards`: pos **12.1** (12.4 → 12.2 → 12.1) — refresh (07-29) continuing to help; still just outside top 10, closing slowly.
- `/coffee-rewards-app`: pos 26.8, still climbing.

---

## 2026-08-03

- **Impressions:** 6,762 (+13%) · **Clicks:** 119 (−1%) · **CTR:** 1.8% · **Avg pos:** 12.9
- **Avg position crossed below 13 (12.9) — new best.** Steady forward grind continues.
- `/blog/coffee-shop-loyalty-cards`: pos **12.2** (12.5 → 12.4 → 12.2) — the 07-29 content refresh (FAQPage schema, freshness, "coffee loyalty app" section, commit fd678f1) may be starting to register ~5 days post-deploy; still just outside top 10.
- Homepage `/`: pos **16.4** (improved from 17.2), 96 clicks, 3.0% CTR. `/coffee-rewards-app`: pos 27.3, still climbing.

---

## 2026-07-29

- **Impressions:** 6,587 (+18%) · **Clicks:** 114 (−4%) · **CTR:** 1.7% · **Avg pos:** 13.0
- Holding steady at the post-revert level; the −4% is a comparison-baseline artifact (prior window rolled onto stronger June days), not a real decline. Avg position at its best (13.0).
- Homepage `/`: 93 clicks, 3.1% CTR — durably recovered. `/blog/coffee-shop-loyalty-cards`: pos **12.5**, still climbing toward top 10. `/coffee-rewards-app`: pos 28.8.
- No SEO impact from the 07-28 USD pricing switch / wallet-secret incident.

---

## 2026-07-27

- **Impressions:** 6,705 (+25%) · **Clicks:** 114 (−1%) · **CTR:** 1.7% · **Avg pos:** 13.3
- **Homepage meta revert validated.** Homepage `/` CTR recovered to **3.0%** (from the 2.40% post-experiment low, heading back toward the 3.34% pre-experiment level) and homepage clicks jumped to **91** (was 71→82). Position also improved to 17.5. The 07-15 revert (commit 45ab3f5) worked — verdict arrived ahead of the early-Aug estimate.
- Overall clicks best in the series (95 → 99 → 106 → 107 → **114**); YoY-period gap essentially closed (−1%). CTR up to 1.7%, avg position best yet (13.3).
- `/blog/coffee-shop-loyalty-cards`: pos **12.9** — crossed below 13, still climbing toward the top 10 (0.1% CTR until it gets there).
- `/coffee-rewards-app`: pos **29.1** (was 33 → 35 → 37 → 41) — climbing steadily off its low base, now 2 clicks / 0.5% CTR.

---

## 2026-07-24

- **Impressions:** 6,950 (+42%) · **Clicks:** 107 (−7%) · **CTR:** 1.5% · **Avg pos:** 13.7
- Continuation of the 07-21 lean — clicks flat (106 → 107), avg position improving (13.9 → 13.7).
- `/blog/coffee-shop-loyalty-cards`: pos **13.2** (13.7 → 13.2) — still climbing toward top 10.
- Homepage `/`: 82 clicks, 2.6% CTR, pos 18.3 — steady. `/coffee-rewards-app`: pos 33.2, improving.

---

## 2026-07-21

- **Impressions:** 6,930 (+47%) · **Clicks:** 106 (−6%) · **CTR:** 1.5% · **Avg pos:** 13.9
- **First encouraging read.** Clicks back above 100 (95 → 99 → 106); avg position best yet (13.9).
- Homepage `/`: **82 clicks, 2.6% CTR, pos 18.6** — clicks up from 76, CTR up from 2.5%. Early hint the 07-15 meta revert is helping as more post-change days enter the 28d window. Not conclusive yet.
- `/blog/coffee-shop-loyalty-cards`: 3,717 impr, pos **13.7** (14.1 → 13.7) — still climbing toward page 1.
- `/coffee-rewards-app`: pos 35.0 (was 37.1), 1 click — slowly improving off a low base.

---

## 2026-07-19

- **Impressions:** 6,890 (+56%) · **Clicks:** 99 (−11%) · **CTR:** 1.4% · **Avg pos:** 14.2
- **Homepage meta revert (07-15) — too early to judge.** Only ~3 days of post-deploy data; the 28d window is still dominated by the old snippet. Homepage `/` this window: 76 clicks, pos 18.9, 2.5% CTR (≈unchanged, as expected). Re-evaluate in the ~2026-08-05 snapshot.
- `/blog/coffee-shop-loyalty-cards`: 3,732 impr (54% of site), pos **14.1** — continues climbing (15.7 → 15.2 → 14.8 → 14.1), right at the page-1 boundary. Still page-2 CTR (~0.1%).
- `/coffee-rewards-app`: pos 37.1 (was 41.6) — improving but still deep.
- Watch: `/alternatives/square-loyalty` slipped to pos 14.7 (was ~6) — fell off page 1 this window. `/alternatives/punchpass` still strong (pos 4.1, 4.6% CTR).

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
