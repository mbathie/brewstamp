import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * DigitalOcean Spaces (S3-compatible) uploads. Used to give shop logos a real
 * public URL — Apple/Google Wallet (and Google specifically, which fetches the
 * logo server-side) can't use the data: URIs we store for the in-app card.
 *
 * Fully optional: if the SPACES_* env vars aren't set, isSpacesConfigured() is
 * false and uploads no-op (return null) — the app falls back to the data URI.
 *
 * Env:
 *   SPACES_KEY, SPACES_SECRET — Spaces access keypair
 *   SPACES_BUCKET             — bucket name
 *   SPACES_REGION             — e.g. syd1, nyc3, sgp1
 *   SPACES_CDN_BASE           — (optional) public base URL override, e.g. a CDN
 *                               or custom domain; defaults to the origin URL.
 */

function cfg() {
  const key = process.env.SPACES_KEY;
  const secret = process.env.SPACES_SECRET;
  const bucket = process.env.SPACES_BUCKET;
  const region = process.env.SPACES_REGION;
  if (!key || !secret || !bucket || !region) return null;
  return { key, secret, bucket, region, cdnBase: process.env.SPACES_CDN_BASE };
}

export function isSpacesConfigured(): boolean {
  return cfg() !== null;
}

// Objects are namespaced as <folder>/<env>/... so a shared bucket (e.g.
// `cultcha`) can host multiple apps and both environments without collisions.
// SPACES_FOLDER is the app's base folder (e.g. "brewstamp").
function keyPrefix(): string {
  const folder = (process.env.SPACES_FOLDER || "").replace(/^\/|\/$/g, "");
  const env = process.env.NODE_ENV === "production" ? "prod" : "dev";
  return folder ? `${folder}/${env}` : env;
}

let client: S3Client | null = null;
function s3(c: NonNullable<ReturnType<typeof cfg>>): S3Client {
  if (!client) {
    client = new S3Client({
      region: c.region,
      endpoint: `https://${c.region}.digitaloceanspaces.com`,
      forcePathStyle: false,
      credentials: { accessKeyId: c.key, secretAccessKey: c.secret },
    });
  }
  return client;
}

function publicUrl(c: NonNullable<ReturnType<typeof cfg>>, key: string): string {
  if (c.cdnBase) return `${c.cdnBase.replace(/\/$/, "")}/${key}`;
  return `https://${c.bucket}.${c.region}.digitaloceanspaces.com/${key}`;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * Upload a shop logo (given as a data: URI) to Spaces and return its public
 * URL. The object key is content-hashed so changing the logo yields a new URL
 * (busts Google/Apple/CDN caches) and an unchanged logo re-uses the same one.
 * Returns null if Spaces isn't configured, the input isn't a data URI, or the
 * upload fails — callers should fall back to the stored data URI.
 */
export async function uploadShopLogo(
  shopId: string,
  dataUri: string,
): Promise<string | null> {
  const c = cfg();
  if (!c) return null;
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUri);
  if (!m) return null;
  const contentType = m[1].toLowerCase();
  const ext = EXT[contentType] || "img";
  const buf = Buffer.from(m[2], "base64");
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12);
  const key = `${keyPrefix()}/shops/${shopId}/logo-${hash}.${ext}`;
  try {
    await s3(c).send(
      new PutObjectCommand({
        Bucket: c.bucket,
        Key: key,
        Body: buf,
        ContentType: contentType,
        ACL: "public-read",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return publicUrl(c, key);
  } catch (err) {
    console.error("[Spaces] logo upload failed for shop", shopId, err);
    return null;
  }
}
