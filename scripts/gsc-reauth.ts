/**
 * Re-authorize the GSC OAuth client with the writable `webmasters` scope so
 * we can submit sitemaps and (later) call the Indexing API.
 *
 * One-time setup: in Google Cloud Console → Credentials → the brewstamp
 * OAuth Web Application client, add `http://localhost:8788/callback` to the
 * Authorized redirect URIs and save.
 *
 * Usage:
 *   npx tsx scripts/gsc-reauth.ts
 *
 * Reads client_id / client_secret from ~/.config/brewstamp/gsc-oauth-token.json
 * (or env), prints an auth URL, captures the redirect on localhost:8788, then
 * writes the new refresh_token back to the same file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { exec } from "node:child_process";

const CALLBACK_PORT = 8788;
const CALLBACK_PATH = "/callback";
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`;
const SCOPES = [
  "https://www.googleapis.com/auth/webmasters",
  // Add the Indexing API scope too — costs nothing extra, and lets us call
  // urlNotifications:publish later if we ever decide to try it.
  "https://www.googleapis.com/auth/indexing",
].join(" ");

const TOKEN_PATH = join(homedir(), ".config/brewstamp/gsc-oauth-token.json");

interface TokenFile {
  refresh_token?: string;
  client_id?: string;
  client_secret?: string;
}

function loadConfig(): TokenFile {
  try {
    return JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveConfig(cfg: TokenFile) {
  writeFileSync(TOKEN_PATH, JSON.stringify(cfg, null, 2) + "\n", { mode: 0o600 });
}

function openBrowser(url: string) {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {
    // ignore — printed url is the fallback
  });
}

async function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const handler = (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url!, `http://localhost:${CALLBACK_PORT}`);
      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("not found");
        return;
      }
      const code = url.searchParams.get("code");
      const err = url.searchParams.get("error");
      if (err) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(`Authorization error: ${err}`);
        server.close();
        reject(new Error(err));
        return;
      }
      if (!code) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("missing code");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<!doctype html><meta charset=utf-8><title>Authorized</title>" +
          "<style>body{font:16px/1.5 -apple-system,sans-serif;padding:40px;background:#1c1917;color:#fafaf9}h1{color:#10b981}</style>" +
          "<h1>✓ Authorized</h1><p>You can close this tab and return to the terminal.</p>",
      );
      server.close();
      resolve(code);
    };
    const server = createServer(handler);
    server.listen(CALLBACK_PORT, () => {
      // ready
    });
    server.on("error", (e) => reject(e));
  });
}

async function main() {
  const cfg = loadConfig();
  const clientId =
    process.env.GSC_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || cfg.client_id;
  const clientSecret =
    process.env.GSC_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    cfg.client_secret;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing OAuth client_id/client_secret. Put them in " +
        TOKEN_PATH +
        " or set GSC_CLIENT_ID / GSC_CLIENT_SECRET env vars.",
    );
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent"); // force refresh_token

  console.log("\nOpening browser for Google sign-in…");
  console.log("If it doesn't open, paste this URL:\n");
  console.log(authUrl.toString());
  console.log(`\nWaiting on ${REDIRECT_URI} …`);
  openBrowser(authUrl.toString());

  const code = await waitForCode();

  console.log("\nExchanging code for refresh token…");
  const tokRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!tokRes.ok) {
    throw new Error(`Token exchange failed: ${tokRes.status} ${await tokRes.text()}`);
  }
  const tok = (await tokRes.json()) as {
    refresh_token?: string;
    access_token: string;
    scope: string;
  };
  if (!tok.refresh_token) {
    throw new Error(
      "No refresh_token in response. Re-run; we ask for prompt=consent but Google sometimes withholds it.",
    );
  }

  cfg.refresh_token = tok.refresh_token;
  cfg.client_id = clientId;
  cfg.client_secret = clientSecret;
  saveConfig(cfg);

  console.log(`\n✓ New refresh token saved to ${TOKEN_PATH}`);
  console.log(`  Scopes granted: ${tok.scope}`);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
