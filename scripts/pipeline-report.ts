/**
 * Conversion pipeline report → ~/Downloads/brewstamp-pipeline-report.html
 *
 *   set -a; source ~/.config/brewstamp/stripe-live.env; set +a
 *   MONGODB_URI=<read-only prod URI from ~/.config/brewstamp/mongo-ro.env> \
 *     npx tsx scripts/pipeline-report.ts
 *
 * Read-only. Scores every free shop on the signals the paying shops showed
 * before they converted (stamps toward the cap, engaged customers, active
 * days, recency), and sets that against signups, cohorts and MRR.
 */
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { connectDB } from "@/lib/mongoose";
import { Shop, User, StampCard, StampRequest, Subscription, WalletPass } from "@/models";
import { getBrewstampFinance } from "@/lib/finance";
import { combineAtRate } from "@/lib/finance-math";

const D = 86400e3;
const OUT = join(homedir(), "Downloads", "brewstamp-pipeline-report.html");
// Test and internal accounts never count as merchants.
const EXCLUDE = /mbathie|mailinator|mark@mark|miovision/i;

async function main() {
  await connectDB();
  const now = Date.now();
  const fin = await getBrewstampFinance({});
  const mrr = combineAtRate(fin.mrr) / 100;
  const mrrAgo = combineAtRate(fin.mrrMonthAgo) / 100;

  const subs: any[] = await Subscription.find({ status: { $in: ["active", "trialing", "past_due"] } }).lean();
  const paid = new Set(subs.map((s) => String(s.shop)));
  const owners = new Map<string, string>(
    (await User.find({}, { email: 1 }).lean()).map((u: any) => [String(u._id), u.email || ""]),
  );
  const shops: any[] = (await Shop.find({}).lean()).filter(
    (s: any) => !EXCLUDE.test(owners.get(String(s.owner)) || ""),
  );

  const act = new Map<string, any>(
    (
      await StampRequest.aggregate([
        { $match: { status: "approved" } },
        {
          $group: {
            _id: "$shop",
            stamps: { $sum: { $ifNull: ["$stampsAwarded", 0] } },
            days: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
            last: { $max: "$createdAt" },
            last14: { $sum: { $cond: [{ $gte: ["$createdAt", new Date(now - 14 * D)] }, 1, 0] } },
          },
        },
      ])
    ).map((r: any) => [String(r._id), r]),
  );
  const cards = new Map<string, any>(
    (
      await StampCard.aggregate([
        { $group: { _id: "$shop", n: { $sum: 1 }, engaged: { $sum: { $cond: [{ $gt: ["$totalEarned", 0] }, 1, 0] } } } },
      ])
    ).map((r: any) => [String(r._id), r]),
  );
  const passes = new Map<string, number>(
    (await WalletPass.aggregate([{ $group: { _id: "$shop", n: { $sum: 1 } } }])).map((r: any) => [String(r._id), r.n]),
  );

  const isEngaged = (s: any) => {
    const a = act.get(String(s._id));
    return !!a && a.stamps >= 5 && (cards.get(String(s._id))?.n || 0) >= 3 && a.days.length >= 2;
  };

  // Candidates: every free shop, scored. Recency gates everything.
  const rows = shops
    .filter((s) => !paid.has(String(s._id)))
    .map((s) => {
      const id = String(s._id);
      const a = act.get(id) || { stamps: 0, days: [], last: null, last14: 0 };
      const cd = cards.get(id) || { n: 0, engaged: 0 };
      const ageD = (now - new Date(s.createdAt).getTime()) / D;
      const lastD = a.last ? (now - new Date(a.last).getTime()) / D : null;
      const recency = lastD == null ? 0 : lastD <= 3 ? 1 : lastD <= 7 ? 0.7 : lastD <= 14 ? 0.4 : lastD <= 30 ? 0.15 : 0;
      const setup = (s.logo ? 1 : 0) + (s.bgColor && s.bgColor !== "stone-800" ? 1 : 0);
      const score =
        recency *
        (40 * Math.min(1, a.stamps / 100) +
          Math.min(30, cd.engaged * 2) +
          Math.min(15, a.days.length * 2) +
          setup * 4 +
          Math.min(6, (passes.get(id) || 0) * 2));
      // Likelihood band — the score made legible. "High" is the profile the
      // paying shops had when they converted (median 73 stamps / 14 engaged
      // customers) AND currently active; recency demotes everything.
      const idle = lastD == null ? Infinity : lastD;
      const strong = a.stamps >= 40 || cd.engaged >= 15 || a.days.length >= 10;
      const some = a.stamps >= 15 || cd.engaged >= 6 || a.days.length >= 4;
      const likelihood: "high" | "medium" | "low" =
        strong && idle <= 3 ? "high"
        : (strong && idle <= 14) || (some && idle <= 7) ? "medium"
        : "low";
      const why = [
        idle === Infinity ? "never stamped" : idle < 1 ? "active today" : `idle ${Math.round(idle)}d`,
        a.stamps >= 40 ? `${a.stamps} stamps` : null,
        cd.engaged >= 6 ? `${cd.engaged} engaged customers` : null,
        a.days.length >= 4 ? `${a.days.length} active days` : null,
      ].filter(Boolean).join(" · ");
      return {
        name: (s.name || "").trim(),
        email: owners.get(String(s.owner)) || "",
        threshold: s.stampThreshold,
        likelihood,
        why,
        ageD,
        lastD,
        stamps: a.stamps,
        customers: cd.n,
        engaged: cd.engaged,
        days: a.days.length,
        last14: a.last14,
        passes: passes.get(id) || 0,
        score,
        engagedTrial: isEngaged(s),
      };
    })
    .sort((a, b) => b.score - a.score);

  // Signups per week (12), cohorts per month, free shops stamping per fortnight (8).
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const k = 11 - i;
    const a = now - (k + 1) * 7 * D, b = now - k * 7 * D;
    return {
      label: new Date(a).toISOString().slice(5, 10),
      n: shops.filter((s) => { const t = new Date(s.createdAt).getTime(); return t >= a && t < b; }).length,
      partial: k === 0,
    };
  });
  const months = Array.from(new Set(shops.map((s) => new Date(s.createdAt).toISOString().slice(0, 7)))).sort();
  const cohorts = months.map((m) => {
    const co = shops.filter((s) => new Date(s.createdAt).toISOString().slice(0, 7) === m);
    return { month: m, shops: co.length, engaged: co.filter(isEngaged).length, paying: co.filter((s) => paid.has(String(s._id))).length };
  });
  const fortnights = Array.from({ length: 8 }, (_, i) => {
    const k = 7 - i;
    const a = now - (k + 1) * 14 * D, b = now - k * 14 * D;
    return { label: new Date(a).toISOString().slice(5, 10), a, b, shops: new Set<string>() };
  });
  const recent: any[] = await StampRequest.find(
    { status: "approved", createdAt: { $gte: new Date(now - 16 * 7 * D) } },
    { shop: 1, createdAt: 1 },
  ).lean();
  for (const r of recent) {
    const sid = String(r.shop);
    if (paid.has(sid)) continue;
    const t = new Date(r.createdAt).getTime();
    for (const f of fortnights) if (t >= f.a && t < f.b) f.shops.add(sid);
  }

  const freeShops = rows.length;
  const active14 = rows.filter((r) => r.last14 > 0).length;
  const bands = { high: rows.filter((r) => r.likelihood === "high").length, medium: rows.filter((r) => r.likelihood === "medium").length };
  const engagedFree = rows.filter((r) => r.engagedTrial).length;
  const generated = new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  const data = {
    generated, mrr, mrrAgo, movement: fin.mrrMovement, paying: paid.size, freeShops, active14, engagedFree, bands,
    weeks, cohorts,
    fortnights: fortnights.map((f) => ({ label: f.label, n: f.shops.size })),
    candidates: rows.slice(0, 20),
  };
  writeFileSync(OUT, render(data), "utf8");
  console.log(`Wrote ${OUT}`);
  console.log(`  paying ${paid.size} · MRR $${mrr.toFixed(0)} (30d ago $${mrrAgo.toFixed(0)}) · free ${freeShops} · active 14d ${active14} · engaged trials ${engagedFree}`);
  process.exit(0);
}

function render(d: any): string {
  const json = JSON.stringify(d).replace(/</g, "\\u003c");
  const growth = d.mrrAgo ? ((d.mrr - d.mrrAgo) / d.mrrAgo) * 100 : 0;
  const prior4 = d.weeks.slice(7, 11).reduce((a: number, w: any) => a + w.n, 0) / 4;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brewstamp conversion pipeline — ${d.generated}</title>
<style>
:root{color-scheme:light dark;--page:#f9f9f7;--surface:#fcfcfb;--ink:#0b0b0b;--ink-2:#52514e;--muted:#898781;--grid:#e1e0d9;--axis:#c3c2b7;--border:rgba(11,11,11,.1);--s1:#2a78d6;--s2:#eb6834;--good:#006300;--bad:#d03b3b;--wash:rgba(42,120,214,.1)}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--page:#0d0d0d;--surface:#1a1a19;--ink:#fff;--ink-2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--axis:#383835;--border:rgba(255,255,255,.1);--s1:#3987e5;--s2:#d95926;--good:#0ca30c;--bad:#e66767;--wash:rgba(57,135,229,.14)}}
:root[data-theme=dark]{--page:#0d0d0d;--surface:#1a1a19;--ink:#fff;--ink-2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--axis:#383835;--border:rgba(255,255,255,.1);--s1:#3987e5;--s2:#d95926;--good:#0ca30c;--bad:#e66767;--wash:rgba(57,135,229,.14)}
*{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--ink);font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding:32px 24px 80px}h1{font-size:22px;font-weight:620;margin:0}.sub{color:var(--ink-2);font-size:13px;margin:2px 0 28px}
h2{font-size:15px;font-weight:620;margin:40px 0 4px}.note{color:var(--muted);font-size:12.5px;margin:0 0 14px;max-width:70ch}
.card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px 18px 14px}.grid{display:grid;gap:14px}.tiles{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}.two{grid-template-columns:1fr 1fr}@media(max-width:780px){.two{grid-template-columns:1fr}}
.tile .label{color:var(--ink-2);font-size:12px;font-weight:550;letter-spacing:.02em;text-transform:uppercase}.tile .value{font-size:32px;font-weight:600;letter-spacing:-.02em;line-height:1.1;margin:6px 0 2px}.tile .delta{font-size:12.5px;color:var(--ink-2)}.up{color:var(--good)}.down{color:var(--bad)}
.chart-title{font-size:13.5px;font-weight:600;margin-bottom:6px}svg{display:block;overflow:visible}.plot{position:relative}
table{border-collapse:collapse;width:100%;font-size:13px;font-variant-numeric:tabular-nums}th,td{text-align:right;padding:7px 9px;border-bottom:1px solid var(--grid);white-space:nowrap}th:first-child,td:first-child,td.l{text-align:left}
th{color:var(--ink-2);font-weight:550;font-size:11.5px;letter-spacing:.03em;text-transform:uppercase;border-bottom:1px solid var(--axis)}tbody tr:hover{background:var(--wash)}.scroll{overflow-x:auto}
.pill{display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:20px;border:1px solid var(--border);color:var(--ink-2)}.pill.hot{color:var(--good);border-color:var(--good)}.pill.warn{color:var(--s2);border-color:var(--s2)}.pill.cold{color:var(--muted)}.lk{font-weight:650;letter-spacing:.02em}.lk.high{color:var(--good);border-color:var(--good);background:color-mix(in srgb,var(--good) 12%,transparent)}.lk.medium{color:var(--s2);border-color:var(--s2)}.lk.low{color:var(--muted)}
.bar-cell{position:relative}.bar-cell .fill{position:absolute;left:0;top:50%;transform:translateY(-50%);height:16px;background:var(--wash);border-radius:3px}.bar-cell span{position:relative}
.tt{position:absolute;pointer-events:none;opacity:0;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:6px 9px;font-size:12px;box-shadow:0 4px 14px rgba(0,0,0,.1);white-space:nowrap;z-index:5}
footer{color:var(--muted);font-size:12px;margin-top:48px;border-top:1px solid var(--grid);padding-top:14px}
</style></head><body><div class="wrap">
<h1>Brewstamp conversion pipeline</h1>
<div class="sub">Generated <b>${d.generated}</b> · every free shop scored on the signals paying shops showed before they converted</div>
<div class="grid tiles">
 <div class="card tile"><div class="label">MRR</div><div class="value">$${d.mrr.toFixed(0)}</div><div class="delta ${growth >= 0 ? "up" : "down"}">${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs 30d ago · ${d.movement.newSubscriptions} new · ${d.movement.churnedSubscriptions} churned</div></div>
 <div class="card tile"><div class="label">Paying shops</div><div class="value">${d.paying}</div><div class="delta">of ${d.paying + d.freeShops} real shops</div></div>
 <div class="card tile"><div class="label">Free, active 14d</div><div class="value">${d.active14}</div><div class="delta">of ${d.freeShops} free shops</div></div>
 <div class="card tile"><div class="label">Likely to convert</div><div class="value">${d.bands.high}<span style="font-size:18px;color:var(--ink-2);font-weight:500"> high · ${d.bands.medium} med</span></div><div class="delta">high = converter profile and active in the last 3 days</div></div>
 <div class="card tile"><div class="label">Engaged trials</div><div class="value">${d.engagedFree}</div><div class="delta">≥5 stamps · ≥3 customers · ≥2 days · not paying</div></div>
 <div class="card tile"><div class="label">Signups this week</div><div class="value">${d.weeks[11].n}</div><div class="delta">partial · prior 4 weeks avg ${prior4.toFixed(1)}</div></div>
</div>
<h2>Candidates</h2>
<p class="note"><b>High</b> = matches the profile paying shops had when they converted (40+ stamps, or 15+ engaged customers, or 10+ active days — the historical median was 73 stamps / 14 customers) <i>and</i> stamped in the last 3 days. <b>Medium</b> = that profile but idle up to a fortnight, or moderate usage (15+ stamps / 6+ engaged / 4+ days) active this week. <b>Low</b> = everything else. Score = recency × (cap proximity + engaged customers + active days + setup + passes). "Nudged" marks shops past 60 stamps, where the automated upgrade email fires.</p>
<div class="card"><div class="scroll"><table id="cands"></table></div></div>
<h2>Trials</h2>
<div class="grid two">
 <div class="card"><div class="chart-title">Signups per week</div><div class="plot" data-bars="weeks"></div></div>
 <div class="card"><div class="chart-title">Free shops stamping, per fortnight</div><div class="plot" data-bars="fortnights"></div></div>
</div>
<h2>Cohorts</h2>
<p class="note">By signup month. Recent cohorts haven't had time to convert, so compare the engaged share rather than the paying share.</p>
<div class="card"><div class="scroll"><table id="cohorts"></table></div></div>
<footer>Generated ${d.generated} from the production database (read-only) and Stripe by <code>scripts/pipeline-report.ts</code>. Test and internal accounts excluded.</footer>
</div>
<script>
const D=${json};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const rec=r=>r.lastD==null?'<span class="pill cold">never</span>':r.lastD<1?'<span class="pill hot">today</span>':r.lastD<=3?'<span class="pill hot">'+Math.round(r.lastD)+'d</span>':r.lastD<=14?'<span class="pill warn">'+Math.round(r.lastD)+'d</span>':'<span class="pill cold">'+Math.round(r.lastD)+'d</span>';
const maxStamps=Math.max(1,...D.candidates.map(c=>c.stamps));
document.getElementById('cands').innerHTML='<thead><tr><th>#</th><th>Shop</th><th style="text-align:center">Likelihood</th><th>Owner</th><th>Age</th><th>Last stamp</th><th>Stamps</th><th>Customers (engaged)</th><th>Active days</th><th>14d</th><th>Passes</th><th>Score</th></tr></thead><tbody>'+
D.candidates.map((c,i)=>'<tr><td>'+(i+1)+'</td><td class="l"><b>'+esc(c.name)+'</b>'+(c.threshold>12?' <span class="pill">'+c.threshold+' stamps</span>':'')+'</td><td style="text-align:center"><span class="pill lk '+c.likelihood+'" title="'+esc(c.why)+'">'+c.likelihood.toUpperCase()+'</span></td><td class="l" style="color:var(--ink-2)">'+esc(c.email)+'</td><td>'+Math.round(c.ageD)+'d</td><td>'+rec(c)+'</td><td class="bar-cell"><div class="fill" style="width:'+(c.stamps/maxStamps*100).toFixed(0)+'%"></div><span>'+c.stamps+(c.stamps>=60?' <span class="pill warn">nudged</span>':'')+'</span></td><td>'+c.customers+' ('+c.engaged+')</td><td>'+c.days+'</td><td>'+c.last14+'</td><td>'+(c.passes||'—')+'</td><td><b>'+c.score.toFixed(0)+'</b></td></tr>').join('')+'</tbody>';
document.getElementById('cohorts').innerHTML='<thead><tr><th>Month</th><th>Shops</th><th>Engaged</th><th>Engaged %</th><th>Paying</th><th>Paying %</th></tr></thead><tbody>'+
D.cohorts.map(c=>'<tr><td>'+c.month+'</td><td>'+c.shops+'</td><td>'+c.engaged+'</td><td>'+(c.shops?(100*c.engaged/c.shops).toFixed(0):0)+'%</td><td>'+c.paying+'</td><td>'+(c.shops?(100*c.paying/c.shops).toFixed(1):0)+'%</td></tr>').join('')+'</tbody>';
function bars(host,rows){
  const W=Math.max(300,host.clientWidth),H=170,M={t:14,r:8,b:26,l:30},iw=W-M.l-M.r,ih=H-M.t-M.b,max=Math.max(1,...rows.map(r=>r.n));
  const NS='http://www.w3.org/2000/svg',el=(n,a)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e};
  const s=el('svg',{width:W,height:H});
  for(const t of [0,Math.ceil(max/2),max]){const y=M.t+ih-(t/max)*ih;s.appendChild(el('line',{x1:M.l,x2:M.l+iw,y1:y,y2:y,stroke:'var(--grid)'}));const l=el('text',{x:M.l-6,y:y+4,'text-anchor':'end',fill:'var(--muted)','font-size':11});l.textContent=t;s.appendChild(l)}
  const gw=iw/rows.length,bw=Math.min(34,gw-6);const tip=document.createElement('div');tip.className='tt';
  rows.forEach((r,i)=>{const x=M.l+gw*i+(gw-bw)/2,h=Math.max(1,(r.n/max)*ih),y=M.t+ih-h;
    const b=el('rect',{x,y,width:bw,height:h,rx:4,fill:'var(--s1)',opacity:r.partial?.55:1});
    b.addEventListener('pointerenter',()=>{tip.innerHTML='<b>w/c '+r.label+'</b>'+(r.partial?' (partial)':'')+'<br>'+r.n;tip.style.opacity=1;tip.style.left=Math.min(x,W-140)+'px';tip.style.top=Math.max(0,y-44)+'px'});
    b.addEventListener('pointerleave',()=>tip.style.opacity=0);s.appendChild(b);
    if(i%2===rows.length%2){const l=el('text',{x:x+bw/2,y:M.t+ih+16,'text-anchor':'middle',fill:'var(--muted)','font-size':10.5});l.textContent=r.label;s.appendChild(l)}
    if(r.n===max||i===rows.length-1){const v=el('text',{x:x+bw/2,y:y-4,'text-anchor':'middle',fill:'var(--ink)','font-size':11,'font-weight':600});v.textContent=r.n;s.appendChild(v)}});
  host.innerHTML='';host.appendChild(s);host.appendChild(tip)}
document.querySelectorAll('[data-bars]').forEach(h=>bars(h,D[h.dataset.bars]));
</script></body></html>`;
}

main().catch((e) => { console.error(e.message); process.exit(1); });
