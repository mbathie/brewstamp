// Generate transparent-bg PNG logos for the sample shops shown on /features.
// Each logo is 900x300 (3:1) and uses a single brand colour matching the card
// it sits on, so the icon shows through the patterned background cleanly.
//
// Usage:
//   node scripts/gen-sample-logos.mjs
//
// Output: public/sample-logos/<slug>.png

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "sample-logos");

const WIDTH = 900;
const HEIGHT = 300;

// Each logo: an SVG with a vector icon on the left and a wordmark on the
// right, all drawn in a single colour against transparent. The shop's card
// uses this colour as its fgColor so the logo looks intentional.
const LOGOS = [
  {
    slug: "bay-brews",
    color: "#fcd34d", // amber-300 — matches the Bay Brews card fgColor
    icon: `
      <g transform="translate(60 60)" stroke="#fcd34d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- steam curls -->
        <path d="M 45 30 Q 50 15 45 0" />
        <path d="M 85 30 Q 90 15 85 0" />
        <path d="M 125 30 Q 130 15 125 0" />
        <!-- cup body -->
        <path d="M 20 55 L 20 145 Q 20 165 40 165 L 130 165 Q 150 165 150 145 L 150 55 Z" />
        <!-- handle -->
        <path d="M 150 80 Q 195 80 195 110 Q 195 140 150 140" />
      </g>
    `,
    text: "BAY BREWS",
    textX: 320,
    fontSize: 90,
    weight: 800,
    spacing: 3,
  },
  {
    slug: "knead",
    color: "#fef3c7", // amber-100
    icon: `
      <g transform="translate(60 60)" stroke="#fef3c7" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- bread loaf outline -->
        <path d="M 25 130 Q 25 70 95 70 Q 165 70 165 130 L 25 130 Z" />
        <!-- score marks on top -->
        <path d="M 60 85 L 75 110" />
        <path d="M 95 80 L 110 110" />
        <path d="M 130 85 L 145 110" />
      </g>
    `,
    text: "Knead",
    textX: 280,
    fontSize: 130,
    weight: 800,
    spacing: 0,
    italic: true,
  },
  {
    slug: "cuts-and-co",
    color: "#fda4af", // rose-300
    icon: `
      <g transform="translate(60 60)" stroke="#fda4af" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- scissors: two circles + crossing blades -->
        <circle cx="35" cy="150" r="22" />
        <circle cx="135" cy="150" r="22" />
        <line x1="55" y1="135" x2="180" y2="20" />
        <line x1="115" y1="135" x2="-10" y2="20" />
      </g>
    `,
    text: "CUTS &amp; CO.",
    textX: 290,
    fontSize: 90,
    weight: 800,
    spacing: 4,
  },
  {
    slug: "tap-room-12",
    color: "#bef264", // lime-300
    icon: `
      <g transform="translate(60 60)" stroke="#bef264" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- pint glass -->
        <path d="M 35 30 L 50 175 Q 52 185 62 185 L 122 185 Q 132 185 134 175 L 149 30 Z" />
        <!-- foam line -->
        <line x1="40" y1="55" x2="144" y2="55" />
        <!-- bubbles -->
        <circle cx="65" cy="40" r="4" />
        <circle cx="92" cy="33" r="4" />
        <circle cx="119" cy="40" r="4" />
      </g>
    `,
    text: "TAP ROOM 12",
    textX: 290,
    fontSize: 78,
    weight: 800,
    spacing: 6,
  },
  {
    slug: "smoothie-lab",
    color: "#fef08a", // yellow-200
    icon: `
      <g transform="translate(60 60)" stroke="#fef08a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- cup with tapered bottom -->
        <path d="M 30 60 L 55 175 Q 57 185 67 185 L 117 185 Q 127 185 129 175 L 154 60 Z" />
        <!-- straw -->
        <line x1="105" y1="20" x2="125" y2="80" />
        <!-- liquid level -->
        <line x1="40" y1="105" x2="144" y2="105" />
      </g>
    `,
    text: "smoothie LAB",
    textX: 290,
    fontSize: 78,
    weight: 800,
    spacing: 2,
  },
];

function buildSvg(logo) {
  const fontStyle = logo.italic ? "italic" : "normal";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  ${logo.icon}
  <text x="${logo.textX}" y="195"
        font-family="Helvetica, Arial, 'Liberation Sans', sans-serif"
        font-weight="${logo.weight}"
        font-style="${fontStyle}"
        font-size="${logo.fontSize}"
        letter-spacing="${logo.spacing}"
        fill="${logo.color}">${logo.text}</text>
</svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const logo of LOGOS) {
    const svg = buildSvg(logo);
    const png = await sharp(Buffer.from(svg), { density: 144 })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const outPath = join(OUT_DIR, `${logo.slug}.png`);
    await writeFile(outPath, png);
    console.log(`✓ ${outPath}  (${png.length} bytes)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
