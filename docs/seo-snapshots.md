# Brewstamp SEO snapshots

Point-in-time pulls from Google Search Console (`sc-domain:brewstamp.app`).
Append a new row + detail block each time you snapshot. Each window is a
trailing 28 days ending on the last day GSC has data for — usually 2–3 days
before the snapshot date, but the lag moves, so the window end can repeat from
one day to the next. When it does, the numbers are unchanged and there's nothing
new to append.

Generate with: `source ~/.config/brewstamp/gsc-oauth.env && npx tsx scripts/gsc-report.ts --days 28`
(OAuth refresh token: `~/.config/brewstamp/gsc-oauth-token.json`.)

For the browsable version — trends, opportunity analysis and derived actions —
`npx tsx scripts/gsc-report-html.ts`, which writes `~/Downloads/brewstamp-seo-report.html`.

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
| 2026-09-02 | 08-03 → 08-30 | 8,285 (+24%) | 172 (+38%) | 2.1% | 11.4 |
| 2026-09-03 | 08-04 → 08-31 | 8,411 (+26%) | 165 (+26%) | 2.0% | 11.3 |
| 2026-09-05 | 08-06 → 09-02 | 8,785 (+30%) | 170 (+26%) | 1.9% | 11.1 |
| 2026-09-07 | 08-08 → 09-04 | 9,222 (+38%) | 175 (+28%) | 1.9% | 10.8 |
| 2026-09-08 | 08-09 → 09-05 | 9,438 (+44%) | 174 (+24%) | 1.8% | 10.7 |
| 2026-09-09 | 08-10 → 09-06 | 9,520 (+45%) | 176 (+22%) | 1.8% | 10.6 |
| 2026-09-12 | 08-13 → 09-09 | 9,982 (+51%) | 192 (+22%) | 1.9% | 10.4 |
| 2026-09-14 | 08-15 → 09-11 | 10,166 (+54%) | 198 (+29%) | 1.9% | 10.2 |
| 2026-09-16 | 08-17 → 09-13 | 10,445 (+58%) | 206 (+39%) | 2.0% | 10.2 |
| 2026-09-17 | 08-18 → 09-14 | 10,430 (+56%) | 199 (+32%) | 1.9% | 10.1 |
| 2026-09-20 | 08-20 → 09-16 | 10,432 (+49%) | 195 (+27%) | 1.9% | 10.1 |

**Trend:** the mid-July inflection has held and re-accelerated. Homepage meta
restored 2026-07-15 (commit 45ab3f5); since then clicks 95 → 172, avg pos 14.5
→ 11.4 (new best), and — after months flat — impressions have turned up again
(+54%) and **past 10,000 for the first time**; avg position 10.2. The money
page `/blog/coffee-shop-loyalty-cards` is **inside the top 10** (pos 9.0)
after the 08-12 content expansion, and a second blog page
(`/blog/coffee-shop-loyalty-card-printing`) sits at the line (10.0). The
meta-revert experiment is closed (homepage CTR ~3.9%, vs 3.34% pre-experiment
baseline). Remaining problem is still "page 1 without clicks" on head terms.
The money page's title/meta were rewritten 2026-09-02 (commit 1c80809) to
attack exactly that; **ten days in the verdict stands: rank and impressions
keep rising (9.0, 5,388 impr), page CTR unmoved at 0.4%, clicks 20 → 23.**
Not a snippet win; the next lever on that page is rank into the top 5. Click
growth is coming from the homepage (128 → 148 in a fortnight) and from the
US/UK/Philippines. Site CTR (1.9%) is held down by impressions compounding
faster than clicks.

---

## 2026-09-20

- **Impressions:** 10,432 (+49%) · **Clicks:** 195 (+27%) · **CTR:** 1.9% · **Avg pos:** 10.1
- Plateau week: impressions flat at ~10.4k for three snapshots, clicks drifting 206 → 199 → 195 as strong mid-August days roll out of the window. Position holds at **10.1**. The +49% growth figure is shrinking because the comparison window is now catching the post-July ramp, not because anything fell.
- `/blog/coffee-shop-loyalty-cards`: pos 8.9, 5,586 impr, 21 clicks, 0.4% — unchanged. Homepage 151 clicks, 3.9%, pos 11.4.
- "loyalty card coffee shop" 164 impr at 9.3; "loyalty card cafe" 163 at 10.3 — still the page-1 zero-click pair. "coffee loyalty app" 3 clicks at 2.2%.
- **By country:** AUS 49 (3.7%), GBR 25 (1.5%), USA 15 on 3,111 impr (0.5%). Mobile 118 clicks at 3.2% vs desktop 75 at 1.1%.

---

## 2026-09-17

- **Impressions:** 10,430 (+56%) · **Clicks:** 199 (+32%) · **CTR:** 1.9% · **Avg pos:** 10.1
- Window rolled one day: a strong 17 Aug dropped off, a quieter 14 Sep came in — clicks 206 → 199, impressions flat. **Position 10.1, best yet.** Not a trend change; day-to-day noise on a 28-day window.
- `/blog/coffee-shop-loyalty-cards`: pos **8.9** (first sub-9), 5,604 impr, 22 clicks, 0.4% CTR. `/blog/coffee-shop-loyalty-card-printing` pos 9.3.
- Homepage `/`: 152 clicks, 3.9% CTR, pos **11.4** (best).
- "loyalty card coffee shop" pos 9.3 (+170% impr); "loyalty card cafe" 163 impr at 10.3, 0 clicks — page-1 impressions without clicks remain the story.
- **By country:** GBR 27 clicks / 1,611 impr (1.7%) holds ahead of USA (16 / 3,073 / 0.5%); AUS 48 (3.6%); NLD 8 at 6.7%. Mobile 119 clicks at 3.2% vs desktop 78 at 1.2%.

---

## 2026-09-16

- **Impressions:** 10,445 (+58%) · **Clicks:** 206 (+39%) · **CTR:** 2.0% · **Avg pos:** 10.2
- **Clicks 206** — first time over 200, and the click growth rate (+39%) is closing on impression growth (+58%) for the first time since July; CTR ticked up to 2.0%. Position held at 10.2.
- `/blog/coffee-shop-loyalty-cards`: pos **9.0**, **5,600 impressions** (54% of all), 23 clicks, 0.4% CTR. Twelve days of the rewrite: rank up, impressions up, CTR still not moving.
- "loyalty card coffee shop" 162 impr, pos 9.4, 1 click; "loyalty card cafe" 160 (+129%), pos 10.2. "coffee stamp card" **pos 7.3**, 1 click. "coffee shop loyalty card printing" pos 6.2 on 68 impr — the printing post is the second-best-ranked non-brand asset.
- New arrivals: "coffee ticket app" (59 impr, pos 2.7, still 0 clicks), "login free coffee" (44, pos 6.0), "a cafe's punch-card promise" (41, pos 3.6) — the last looks like a Discover/news-style query.
- Homepage `/`: **155 clicks** (new high), **4.0%** CTR, pos 11.6.
- **By country:** **GBR 27 clicks on 1,606 impr (1.7%) — now ahead of the US on clicks** (USA 3,086 impr / 16 clicks / 0.5%). AUS 48 (3.6%), PHL 13, IND 8, NLD 8 at 6.6%, CAN 5. **Mobile 123 clicks at 3.3% vs desktop 81 at 1.2%.**
- Context: Stripe → PayPal billing migration went live this week; no SEO impact expected.

---

## 2026-09-14

- **Impressions:** 10,166 (+54%) · **Clicks:** 198 (+29%) · **CTR:** 1.9% · **Avg pos:** 10.2
- **Impressions crossed 10,000** — from 6,294 at the first snapshot in July. Clicks 198 (new high, +6 in two days), position 10.2 (best). CTR flat at 1.9%. The growth gap (+54% vs +29%) is the widest yet, same shape as the last fortnight.
- `/blog/coffee-shop-loyalty-cards`: pos **9.0**, **5,388 impressions** (new high, 53%), clicks **23** (from 22), CTR 0.4%. Ten days of the rewrite in window; the verdict from 09-12 stands — rank and impressions climb, CTR doesn't. "loyalty card coffee shop" 163 impr (+167%), pos 9.4, 1 click.
- **New climber:** "coffee one loyalty card" 42 impr (+200%), pos **8.5**, 0 clicks — a branded/competitor phrase landing on page 1. "loyalty cards for coffee shops" improved to 7.2. "coffee stamp card" 7.1 with 1 click.
- "coffee ticket app": fourth snapshot at **pos 2.8**, 57 impressions, 0 clicks. Still unexplained.
- Homepage `/`: **148 clicks** (new high), **3.9%** CTR, pos 11.6 (best) — the engine behind the click growth. `/coffee-rewards-app` pos 28.4, tenth snapshot stuck.
- **By country:** USA 2,972 impr / 16 clicks / 0.5%; AUS 45 (3.3%); **GBR 24 (new high, 1.5%)**; PHL 13 (3.4%); IND 8; NLD 8 at 6.4%; CYP 4, MAR 4. **Mobile 114 clicks at 3.1% vs desktop 82 at 1.3%** — mobile now 58% of clicks on 36% of impressions.

---

## 2026-09-12

- **Impressions:** 9,982 (+51%) · **Clicks:** 192 (+22%) · **CTR:** 1.9% · **Avg pos:** 10.4
- GSC caught up three days. **New highs on clicks (192, first past 190), impressions (a whisker under 10,000) and position.** CTR recovered a tenth to 1.9%.
- **The rewrite's fair read (8 days in window):** `/blog/coffee-shop-loyalty-cards` pos **9.1** (from 9.3), **5,271 impressions** (new high, 53%), clicks **22 — flat**, CTR **0.4% — unmoved**. Its target query "loyalty card coffee shop" 160 impr (**+162%**), pos 9.4, still 1 click. Verdict: the rewrite has not lifted CTR. Rank and impressions keep improving on the page, so the content expansion is still working; the snippet isn't. Bottom-of-page-1 (9.1) is simply where few people look — the next lever on this page is rank into the top 5, not copy.
- **Where the clicks actually came from:** homepage `/` **143 clicks (from 128), 3.8% CTR, pos 11.8** — best on record. By country, **USA 16 clicks (from 9)** and **PHL 13 (from 7)** — the US pool converting at 0.6% instead of 0.3% is worth more than any blog page right now.
- `/blog/coffee-shop-loyalty-card-printing`: pos 10.1, 225 impr, **1 click** — its first. "coffee stamp card" also earned its first (pos 7.0).
- "coffee ticket app": third snapshot at **pos 2.8**, 55 impressions, 0 clicks. Still unexplained; still growing.
- `/coffee-rewards-app`: pos 28.1 — ninth snapshot stuck. `/alternatives/square-loyalty` climbed to 235 impressions (pos 13.3).
- **By country:** USA 2,861 impr / 16 clicks / 0.6%; AUS 42 (3.2%, down from 47); GBR 22 (1.4%); PHL 13 (3.5%); IND 8; NLD 8 at 6.8%. New: CYP 4 clicks (UTU Coffee signed up this week), MAR 4. **Mobile 107 clicks at 3.0% vs desktop 83 at 1.3%.**

---

## 2026-09-09

- **Impressions:** 9,520 (+45%) · **Clicks:** 176 (+22%) · **CTR:** 1.8% · **Avg pos:** 10.6
- New highs on impressions, clicks and position. CTR holds at 1.8%. The impressions/clicks growth gap (+45% vs +22%) is the widest yet — same "landing on page 1 unconverted" shape.
- `/blog/coffee-shop-loyalty-cards`: pos **9.3** (from 9.4), **5,051 impressions** — first time past 5,000, 53% of the site — clicks **22** (20 → 21 → 22 across the last three snapshots after five flat). Rewrite (commit 1c80809) has five days in this window. Two consecutive upticks is the start of a signal, not proof.
- Target queries: "loyalty card coffee shop" 148 impr (**+143%**), pos 9.6, 1 click; "coffee loyalty card" 3 clicks at 1.2%; "loyalty card cafe" 140 (+92%), 10.5, 0; "cafe loyalty card" 66 (+106%), 10.2, 0; "coffee card" 92 (+84%), 10.9, 0.
- `/blog/coffee-shop-loyalty-card-printing`: pos 9.9, 225 impr, 0 clicks — head query "coffee shop loyalty card printing" at **6.2**, 72 impr, 0 clicks. Still the next snippet job.
- "coffee ticket app" — second snapshot at **pos 3.0**, now 45 impressions, 0 clicks. Persisting, so worth finding which page matches and why.
- `/coffee-rewards-app`: pos 27.7 — eighth snapshot stuck. Homepage 128 clicks, 3.6%, pos 12.1.
- **By country:** USA 2,732 impressions at **0.3%** (9 clicks) — lowest CTR yet on the biggest pool. AUS 47 (3.6%), GBR 21 (1.4%), NLD 7 at 6.0%, PHL 7, IND 6, ZAF 4 at 9.1%. Mobile 2.7% vs desktop 1.4%.

---

## 2026-09-08

- **Impressions:** 9,438 (+44%) · **Clicks:** 174 (+24%) · **CTR:** 1.8% · **Avg pos:** 10.7
- New highs on impressions and position again; clicks flat (174 vs 175). **CTR 1.8% is the lowest in the series** — impressions +44% against clicks +24%. Not a loss of clicks, a flood of unconverted impressions.
- `/blog/coffee-shop-loyalty-cards`: pos **9.4** (from 9.5), **4,991 impressions** (new high, 53%), clicks **21** — the first movement off 20 in five snapshots. Rewrite (commit 1c80809, live 09-02) has four days in this window.
- **First flicker on the rewrite's target query:** "loyalty card coffee shop" 144 impr (+132%), pos 9.7, **1 click** — its first ever. "coffee loyalty card" 3 clicks at 1.2% (was 0.4–0.8%). One click is not a signal; two snapshots of it would be. Still calling 09-10 the first fair read.
- Rest of the target cluster: "loyalty card cafe" 139 (+90%), 10.7, 0 clicks; "coffee card" 92 (+80%), 11.5, 0; "loyalty cards for coffee shops" 67, 8.1, 0.
- `/blog/coffee-shop-loyalty-card-printing`: pos 9.8 (from 9.5), 227 impr, 0 clicks. Head query still 6.3 / 72 impr / 0 clicks. Next snippet job, unchanged.
- **New debut:** "coffee ticket app" — 40 impressions at pos **3.1**, 0 clicks. Worth a look at what's ranking: a top-3 position on a phrase we never targeted.
- `/coffee-rewards-app`: pos 28.1 — seventh snapshot stuck. Homepage 128 clicks, 3.6%, pos 12.1.
- **By country:** USA 2,736 impressions at **0.4%**, clicks down to 10 — the widening gap continues. AUS 46 (3.5%), **GBR 22 (new high, 1.5%)**, PHL 7, IND 6, NLD 6 at 5.3%, IDN 4 at 5.7%. Mobile 2.7% vs desktop 1.3%.

---

## 2026-09-07

- **Impressions:** 9,222 (+38%) · **Clicks:** 175 (+28%) · **CTR:** 1.9% · **Avg pos:** 10.8
- **Three new highs:** impressions (first time past 9,000), clicks (175), and avg position (10.8 — first sub-11). Impressions are now growing ~4× faster than clicks, which is the "arriving on page 1 without converting snippets" shape; CTR is flat at 1.9%.
- `/blog/coffee-shop-loyalty-cards`: pos **9.5** (from 9.8), **4,851 impressions** (new high, 53% of the site), 20 clicks, CTR 0.4%. The title/meta rewrite (commit 1c80809, live 09-02) has three days in this window and **no visible lift yet** — clicks stuck at 20 for four snapshots running. Too early to call, but it's the number to watch; if it's still 20 on the 09-10 snapshot the rewrite isn't working and it's a rank problem, not a snippet one.
- Its target queries keep swelling without paying: "loyalty card coffee shop" **140 impr (+119%), pos 9.8, 0 clicks**; "loyalty card cafe" 135 (+67%), 10.9; "coffee card" 88 (+76%), 11.9; "loyalty cards for coffee shops" 67, pos 8.2, 0 clicks.
- `/blog/coffee-shop-loyalty-card-printing`: pos **9.5** (slipped from 9.0), 225 impr, still 0 clicks. Head query "coffee shop loyalty card printing" pos 6.3 / 70 impr / 0 clicks — still the next snippet job.
- `/coffee-rewards-app`: pos **28.0** — sixth snapshot stuck, drifting the wrong way. Content-expansion target, unchanged.
- Homepage `/`: 131 clicks (new high), 3.7% CTR, pos 12.1. Still three-quarters of all clicks.
- "coffee cart rewards" +720% to 41 impressions at pos 34 — a long-tail phrase worth a section somewhere.
- **By country:** USA 2,700 impressions at **0.4%** (12 clicks) — the pool keeps growing, the CTR keeps falling. AUS 47 clicks (3.6%), GBR 20 (1.4%), PHL 7, IND 6, NLD 6 at 5.5%. New: IDN 4 clicks at 5.9%. Mobile 2.8% vs desktop 1.4%.

---

## 2026-09-05

- **Impressions:** 8,785 (+30%) · **Clicks:** 170 (+26%) · **CTR:** 1.9% · **Avg pos:** 11.1
- GSC caught up two days at once (09-01 and 09-02 both in). **New highs on impressions and avg position** again; clicks 170 steady. CTR eased to 1.9% — impressions are compounding faster than clicks, which is the shape you'd expect while pages arrive on page 1 without snippets that convert yet.
- `/blog/coffee-shop-loyalty-cards`: pos **9.8** (from 10.1) — properly inside the top 10 now. **4,555 impressions** (new high, 52% of the site), 20 clicks, CTR 0.4%. The 09-02 title/meta rewrite (commit 1c80809) is only a partial day in this window; no read yet.
- `/blog/coffee-shop-loyalty-card-printing`: pos **9.0** (from 9.8), 223 impressions, still 0 clicks. Its query "coffee shop loyalty card printing" sits at pos 6.3 with 71 impressions and 0 clicks — same snippet treatment as the money page is the next move.
- The two page-1 queries the rewrite targets keep growing: "loyalty card coffee shop" **126 impr (+88%), pos 9.7**; "loyalty cards for coffee shops" 66, pos 8.5. Both 0 clicks. "loyalty card cafe" 127 (+61%) at 10.9 is right behind them.
- `/coffee-rewards-app`: pos 27.6 — unchanged for five snapshots. Still the content-expansion target.
- Homepage `/`: 126 clicks, 3.7% CTR, pos 12.4 — steady, still the click engine.
- **By country:** USA 2,553 impressions at 0.5% (12 clicks) — biggest pool, same gap. AUS 43 clicks (3.4%), GBR 20 (1.5%), PHL 9 (2.6%). New: NLD 5 clicks at 4.9% on 102 impressions. Mobile 2.7% vs desktop 1.5%.

---

## 2026-09-03

- **Impressions:** 8,411 (+26%) · **Clicks:** 165 (+26%) · **CTR:** 2.0% · **Avg pos:** 11.3
- **New highs on impressions (8,411) and avg position (11.3).** Clicks eased 172 → 165, but that's the one-day window shift (08-03 out, 08-31 in), not a trend — the daily impression run is the strongest on record (7-day avg ~370/day, peak day 08-27).
- `/blog/coffee-shop-loyalty-cards`: pos **10.1** (from 10.3), **4,330 impressions** (new high, ~51% of the site), 20 clicks, CTR still 0.5%. Position keeps creeping in; CTR hasn't moved. The **title/meta rewrite shipped 2026-09-02** (commit 1c80809 — "8 Stamps, No App, Free to Start") and is not in this window yet. That's the thing to watch next: the two page-1 queries it targets are "loyalty card coffee shop" (116 impr, pos 9.5, **+71%**) and "loyalty cards for coffee shops" (65, pos 8.8) — both still 0 clicks.
- **Second blog page is now inside the top 10:** `/blog/coffee-shop-loyalty-card-printing` pos **9.8** (from 10.3), 223 impressions, 0 clicks. Maps to "coffee shop loyalty card printing" (74 impr, pos 6.3, 0 clicks). Same snippet treatment is the obvious next move.
- `/coffee-rewards-app`: pos **27.3**, 4 clicks — unchanged for four snapshots. Still the clearest content-expansion target.
- Homepage `/`: 119 clicks, 3.6% CTR, pos 12.6 — steady.
- Big impression climbers this window: "loyalty card cafe" +43% (117, pos 11.1), "coffee card" +75% (77, pos 13.1), "coffee shop loyalty app" +100% (70, pos 16.4), "coffee shop loyalty reward app" +36% (101, pos 17.8). Demand is arriving faster than rank on the "app" phrasings.
- **By country:** USA 2,394 impressions at 0.5% CTR (11 clicks) — largest pool, unchanged gap. AUS 41 clicks (3.3%), GBR 17 (1.3%), PHL 9 (2.9%). Mobile CTR 2.7% vs desktop 1.5%.

---

## 2026-09-02

- **Impressions:** 8,285 (+24%) · **Clicks:** 172 (+38%) · **CTR:** 2.1% · **Avg pos:** 11.4
- **Consolidation on the breakthrough** — new highs on impressions (8,285) and avg position (11.4, best ever); clicks flat at 172. Last month's jump wasn't a spike; it's holding.
- `/blog/coffee-shop-loyalty-cards`: pos **10.3** (from 10.6), **4,232 impressions** (new high, still ~51% of the site), holding right on the top-10 line. Clicks eased 20 → 19 and CTR is still only 0.4% — the position is now *there*, so the untapped lever is the snippet/CTR, not the ranking.
- **A second blog page arrived at the door:** `/blog/coffee-shop-loyalty-card-printing` jumped to pos **10.3** (from 12.4) — 217 impressions, 0 clicks. It maps to the "coffee shop loyalty card printing" query (pos 6.3). Same content/snippet treatment that worked on the first blog post would likely tip this one over too.
- `/coffee-rewards-app`: pos **27.0** — still stuck at ~25–27, unchanged for three snapshots. Remains the clearest content-expansion target.
- Homepage `/`: 126 clicks, 3.8% CTR, pos 12.7 — steady, position still creeping up.
- **"Page 1, zero clicks" head terms** (the snippet opportunity): coffee shop loyalty card printing (6.3), coffee stamp card (7.7), "best eco-friendly digital stamp cards…" (7.3), loyalty cards for coffee shops (9.1), loyalty card coffee shop (9.5). New long-tail climber: "coffee cart rewards" +450% impr (pos 37).
- **By country:** USA still the biggest impression pool (2,352) at 0.5% CTR — the latent upside is unchanged. AUS best converter (45 clicks, 3.7%); GBR 16 clicks (1.2%); PHL 10 clicks (3.2%).

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
