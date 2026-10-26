// Writes src/lib/content-dates.json: each public page's path -> the date its
// source last changed in git, for the sitemap's <lastmod> and the blog posts'
// dateModified. Runs before every build; without git (or outside a checkout)
// it leaves the committed file as it is.
//
// Commits whose message contains "[no-content-date]" are skipped, so
// refactors that touch every page (imports, tooling) don't make every post
// look freshly updated.
import { execFileSync } from "node:child_process";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const APP = join(ROOT, "src/app");
const OUT = join(ROOT, "src/lib/content-dates.json");
const SKIP_DIRS = new Set(["dashboard", "api", "admin", "s", "invite", "_components"]);
const MARKER = "[no-content-date]";

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function lastContentDate(files) {
  const out = git(["log", "--format=%cs%x09%s", "--", ...files]);
  for (const line of out.split("\n")) {
    const [date, subject = ""] = line.split("\t");
    if (date && !subject.includes(MARKER)) return date;
  }
  return null;
}

function pages(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name) && !name.startsWith("[")) found.push(...pages(full));
    } else if (name === "page.tsx") {
      found.push(full);
    }
  }
  return found;
}

try {
  git(["rev-parse", "--is-inside-work-tree"]);
} catch {
  console.log("content-dates: no git checkout, keeping the committed dates");
  process.exit(0);
}

const dates = {};
for (const file of pages(APP)) {
  const route = "/" + relative(APP, file).split(sep).slice(0, -1).filter((s) => !s.startsWith("(")).join("/");
  const date = lastContentDate([relative(ROOT, file)]);
  if (date) dates[route === "/" ? "/" : route.replace(/\/$/, "")] = date;
}
// Translated home pages share one template and one copy file.
const lang = lastContentDate(["src/app/[lang]/page.tsx", "src/lib/i18n/landing.ts"]);
if (lang) dates["/[lang]"] = lang;

writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(dates).sort()), null, 2) + "\n");
console.log(`content-dates: ${Object.keys(dates).length} pages`);
