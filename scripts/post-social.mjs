// Usage:
//   node --env-file=.env.local scripts/post-social.mjs \
//     --platforms=ig,fb \
//     --image="https://..." \
//     --caption="..." \
//     [--caption-fb="..."] \
//     [--caption-ig="..."] \
//     [--image-fb="..."] \
//     [--image-ig="..."] \
//     [--dry-run]
//
// Defaults to posting to both IG and FB. Pass --platforms=ig (or fb) for one.
// Image URLs must be public HTTPS — Meta fetches them server-side.
//
// Per-platform overrides:
//   --caption-fb / --caption-ig    use to differ copy per platform (FB renders URLs
//                                   as clickable; IG doesn't, so usually IG says
//                                   "link in bio" and FB pastes the URL).
//   --image-fb / --image-ig        FB likes 1200x900 (4:3); IG prefers 1080x1350 (4:5).
//                                   For Pexels images, swap the &w=&h= params.

import { parseArgs } from "node:util";

const GRAPH = "https://graph.facebook.com/v21.0";

const { values: args } = parseArgs({
  options: {
    platforms: { type: "string", default: "ig,fb" },
    image: { type: "string" },
    "image-fb": { type: "string" },
    "image-ig": { type: "string" },
    caption: { type: "string", default: "" },
    "caption-fb": { type: "string" },
    "caption-ig": { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

const platforms = args.platforms
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean);

for (const p of platforms) {
  if (!["ig", "fb"].includes(p)) {
    console.error(`Unknown platform: ${p}. Valid: ig, fb`);
    process.exit(1);
  }
}

const igUserId = process.env.IG_USER_ID;
const fbPageId = process.env.IG_PAGE_ID; // historical name; this IS the FB Page ID
const token = process.env.IG_PAGE_ACCESS_TOKEN;

if (!token) {
  console.error("Missing IG_PAGE_ACCESS_TOKEN in env");
  process.exit(1);
}
if (platforms.includes("ig") && !igUserId) {
  console.error("Missing IG_USER_ID in env (required for IG)");
  process.exit(1);
}
if (platforms.includes("fb") && !fbPageId) {
  console.error("Missing IG_PAGE_ID in env (required for FB)");
  process.exit(1);
}

function imageFor(platform) {
  return args[`image-${platform}`] || args.image;
}

function captionFor(platform) {
  return args[`caption-${platform}`] || args.caption;
}

if (!imageFor("ig") && platforms.includes("ig")) {
  console.error("Missing --image (or --image-ig) for IG");
  process.exit(1);
}
if (!imageFor("fb") && platforms.includes("fb")) {
  console.error("Missing --image (or --image-fb) for FB");
  process.exit(1);
}

async function graph(method, path, body) {
  const url = new URL(`${GRAPH}${path}`);
  const init = { method };
  if (method === "GET") {
    url.searchParams.set("access_token", token);
    if (body) for (const [k, v] of Object.entries(body)) url.searchParams.set(k, v);
  } else {
    init.body = new URLSearchParams({ access_token: token, ...body });
  }
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`${method} ${path}: ${JSON.stringify(json.error || json)}`);
  }
  return json;
}

async function pollMedia(creationId) {
  for (let i = 0; i < 20; i++) {
    const r = await graph("GET", `/${creationId}`, {
      fields: "status_code,status",
    });
    if (r.status_code === "FINISHED") return;
    if (r.status_code === "ERROR") throw new Error(`Container failed: ${r.status}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Container did not finish within 40s");
}

async function postIg() {
  const image = imageFor("ig");
  const caption = captionFor("ig");
  console.log("\n=== Instagram ===");
  console.log(`Image:   ${image}`);
  console.log(`Caption: ${caption.split("\n")[0]}${caption.includes("\n") ? "…" : ""}`);

  if (args["dry-run"]) {
    console.log("[dry-run] skipping publish");
    return;
  }

  const container = await graph("POST", `/${igUserId}/media`, {
    image_url: image,
    caption,
  });
  console.log(`Container: ${container.id}`);
  await pollMedia(container.id);
  const published = await graph("POST", `/${igUserId}/media_publish`, {
    creation_id: container.id,
  });
  const post = await graph("GET", `/${published.id}`, { fields: "permalink" });
  console.log(`✓ ${post.permalink}`);
}

async function postFb() {
  const image = imageFor("fb");
  const caption = captionFor("fb");
  console.log("\n=== Facebook Page ===");
  console.log(`Image:   ${image}`);
  console.log(`Caption: ${caption.split("\n")[0]}${caption.includes("\n") ? "…" : ""}`);

  if (args["dry-run"]) {
    console.log("[dry-run] skipping publish");
    return;
  }

  const post = await graph("POST", `/${fbPageId}/photos`, {
    url: image,
    message: caption,
  });
  console.log(`✓ https://www.facebook.com/${post.post_id}`);
}

async function main() {
  console.log(`Posting to: ${platforms.join(", ")}`);
  for (const p of platforms) {
    if (p === "ig") await postIg();
    if (p === "fb") await postFb();
  }
}

main().catch((err) => {
  console.error("\n✗", err.message || err);
  process.exit(1);
});
