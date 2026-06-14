// CI/build guard: fail if any locale dictionary is missing a key that exists
// in en.ts (the canonical source). Wired into `prebuild` so a missing
// translation blocks the build/deploy. Run directly with `npm run check:i18n`.
//
// Uses plain text parsing (not module import) to avoid tsx/ESM interop quirks
// and to stay dependency-free. Keys are top-level `  name:` lines.
import { readFileSync } from "fs";

const DIR = "src/lib/i18n";

const idx = readFileSync(`${DIR}/index.ts`, "utf8");
const block = idx.match(/SUPPORTED_LANGUAGES\s*=\s*\[([^\]]+)\]/);
if (!block) {
  console.error("check-i18n: couldn't parse SUPPORTED_LANGUAGES from index.ts");
  process.exit(2);
}
const langs = [...block[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);

const keysOf = (lang) => {
  const src = readFileSync(`${DIR}/${lang}.ts`, "utf8");
  const set = new Set();
  for (const m of src.matchAll(/^ {2}([A-Za-z0-9_]+):/gm)) set.add(m[1]);
  return set;
};

const en = keysOf("en");
let failed = false;

for (const lang of langs.filter((l) => l !== "en")) {
  const k = keysOf(lang);
  const missing = [...en].filter((x) => !k.has(x));
  const extra = [...k].filter((x) => !en.has(x));
  if (missing.length) {
    failed = true;
    console.error(
      `✗ ${lang}.ts is missing ${missing.length} key(s): ${missing.join(", ")}`,
    );
  }
  if (extra.length) {
    console.warn(
      `  ⚠ ${lang}.ts has ${extra.length} key(s) not in en.ts: ${extra.join(", ")}`,
    );
  }
}

if (failed) {
  console.error(
    "\n✗ i18n check failed — add the missing keys to each locale (they fall back to English otherwise).",
  );
  process.exit(1);
}
console.log(
  `✓ i18n: all ${langs.length - 1} locales have every en.ts key (${en.size} keys).`,
);
