/**
 * One-off: build the world map used by scripts/gsc-report-html.ts.
 *
 * Fetches Natural Earth 1:110m countries (public domain), projects them with
 * Equal Earth, and writes compact SVG path data keyed by ISO 3166-1 alpha-3 to
 * scripts/assets/world-paths.json. Search Console reports countries as alpha-3,
 * so the report can colour paths directly. Re-run only if the asset is lost.
 *
 *   npx tsx scripts/build-world-paths.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const W = 960;
const H = 480;

// Equal Earth (Šavrič, Patterson & Jenny 2018) — closed form, no lookup table.
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
const M = Math.sqrt(3) / 2;
function project(lon: number, lat: number): [number, number] {
  const λ = (lon * Math.PI) / 180;
  const φ = (lat * Math.PI) / 180;
  const θ = Math.asin(M * Math.sin(φ));
  const θ2 = θ * θ, θ6 = θ2 * θ2 * θ2;
  const x = (2 * Math.sqrt(3) * λ * Math.cos(θ)) /
    (3 * (A1 + 3 * A2 * θ2 + θ6 * (7 * A3 + 9 * A4 * θ2)));
  const y = θ * (A1 + A2 * θ2 + θ6 * (A3 + A4 * θ2));
  return [x, -y];
}

type Ring = number[][];
type Feature = {
  properties: Record<string, string>;
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Ring[] | Ring[][] };
};

async function main() {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const geo = (await res.json()) as { features: Feature[] };

  // Project everything first so the fit is computed from the real extent.
  const projected: Array<{ iso: string; name: string; rings: Ring[] }> = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of geo.features) {
    const p = f.properties;
    // Natural Earth uses "-99" where ISO is disputed (France, Norway…); the
    // admin code carries the usable alpha-3 there.
    const iso = [p.ISO_A3, p.ISO_A3_EH, p.ADM0_A3].find((v) => v && v !== "-99");
    if (!iso) continue;
    const polys =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates as Ring[]]
        : (f.geometry.coordinates as Ring[][]);
    const rings: Ring[] = [];
    for (const poly of polys) {
      for (const ring of poly) {
        const pr = ring.map(([lon, lat]) => {
          const [x, y] = project(lon, lat);
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
          return [x, y];
        });
        rings.push(pr);
      }
    }
    projected.push({ iso, name: p.NAME || p.ADMIN, rings });
  }

  const scale = Math.min(W / (maxX - minX), H / (maxY - minY));
  const ox = (W - (maxX - minX) * scale) / 2 - minX * scale;
  const oy = (H - (maxY - minY) * scale) / 2 - minY * scale;
  const fmt = (v: number) => (Math.round(v * 10) / 10).toString();

  const out: Record<string, { name: string; d: string }> = {};
  for (const c of projected) {
    let d = "";
    for (const ring of c.rings) {
      // Drop consecutive points that round to the same pixel — 110m is already
      // coarse, this just trims the file.
      let last = "";
      ring.forEach(([x, y], i) => {
        const px = fmt(x * scale + ox), py = fmt(y * scale + oy);
        const key = `${px},${py}`;
        if (key === last) return;
        d += (i === 0 ? "M" : "L") + px + " " + py;
        last = key;
      });
      d += "Z";
    }
    // Antarctica adds a huge path and never has traffic — keep it, but let the
    // report style it as background.
    out[c.iso] = { name: c.name, d };
  }

  const outPath = join(process.cwd(), "scripts/assets/world-paths.json");
  writeFileSync(outPath, JSON.stringify({ width: W, height: H, countries: out }));
  const kb = Math.round(JSON.stringify(out).length / 1024);
  console.log(`wrote ${outPath}: ${Object.keys(out).length} countries, ~${kb} KB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
