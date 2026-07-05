/**
 * Apple Wallet cert → env var helper.
 *
 * Turns the files Apple gives you (Pass Type ID certificate, its private key,
 * and Apple's WWDR intermediate cert) into the base64-encoded PEM env vars the
 * app reads in src/lib/wallet/config.ts:
 *
 *   APPLE_PASS_CERT_BASE64   APPLE_PASS_KEY_BASE64   APPLE_WWDR_BASE64
 *
 * It normalises any input format (DER .cer, PEM, or a .p12 bundle) to PEM via
 * openssl, checks the key matches the cert and the cert isn't expired, then
 * writes a chmod-600 env file you can source locally and paste into DigitalOcean.
 *
 * Usage — a Keychain .p12 bundle (cert + key together):
 *   npx tsx scripts/apple-wallet-setup.ts \
 *     --p12 pass.p12 --p12-password 'secret' \
 *     --wwdr AppleWWDRCAG4.cer \
 *     --pass-type-id pass.app.brewstamp --team-id ABCDE12345
 *
 * Usage — separate cert + key files:
 *   npx tsx scripts/apple-wallet-setup.ts \
 *     --cert pass.cer --key signerKey.pem [--key-password 'secret'] \
 *     --wwdr AppleWWDRCAG4.cer \
 *     --pass-type-id pass.app.brewstamp --team-id ABCDE12345
 *
 * Flags:
 *   --out <path>   env file to write (default ~/.config/brewstamp/apple-wallet.env)
 *   --print        also echo the env block to stdout (secrets!) — off by default
 *
 * No secrets are printed unless you pass --print. Requires the `openssl` CLI.
 */
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir, homedir } from "node:os";
import { join, dirname } from "node:path";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function has(name: string): boolean {
  return process.argv.includes(name);
}

function die(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// A short-lived, private scratch dir for the intermediate PEMs openssl needs on
// disk. Removed on exit no matter what.
const work = mkdtempSync(join(tmpdir(), "apple-wallet-"));
process.on("exit", () => {
  try {
    rmSync(work, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

function openssl(args: string[], input?: Buffer): Buffer {
  return execFileSync("openssl", args, {
    input,
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 1024 * 1024 * 8,
  });
}

function isPem(buf: Buffer): boolean {
  return buf.includes("-----BEGIN");
}

// Pull the first PEM block of any type out of noisy openssl output (e.g. the
// "Bag Attributes" preamble pkcs12 emits).
function firstPemBlock(text: string): string {
  const m = text.match(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/);
  if (!m) die("expected a PEM block in openssl output but found none");
  return m[0].trim() + "\n";
}

function tmp(name: string, data: Buffer | string): string {
  const p = join(work, name);
  writeFileSync(p, data, { mode: 0o600 });
  return p;
}

// --- Normalise a certificate (DER .cer or PEM) to a clean PEM string. --------
function certToPem(path: string, label: string): string {
  const raw = readFileSync(path);
  const inform = isPem(raw) ? "PEM" : "DER";
  try {
    const out = openssl([
      "x509",
      "-inform",
      inform,
      "-in",
      path,
      "-outform",
      "PEM",
    ]);
    return out.toString("utf8").trim() + "\n";
  } catch (e: any) {
    die(`couldn't read ${label} certificate at ${path}: ${e.stderr || e.message}`);
  }
}

// --- Extract cert + key from a .p12 bundle. openssl 3 needs -legacy for the
// RC2-encrypted p12s Keychain still produces, so we retry with it on failure.
function fromP12(
  p12Path: string,
  password: string,
): { certPem: string; keyPem: string } {
  const runs = [
    ["-passin", `pass:${password}`],
    ["-legacy", "-passin", `pass:${password}`],
  ];
  let lastErr = "";
  for (const extra of runs) {
    try {
      const certRaw = openssl([
        "pkcs12",
        "-in",
        p12Path,
        "-clcerts",
        "-nokeys",
        ...extra,
      ]).toString("utf8");
      const keyRaw = openssl([
        "pkcs12",
        "-in",
        p12Path,
        "-nocerts",
        "-nodes",
        ...extra,
      ]).toString("utf8");
      return {
        certPem: firstPemBlock(certRaw),
        keyPem: firstPemBlock(keyRaw),
      };
    } catch (e: any) {
      lastErr = String(e.stderr || e.message);
    }
  }
  die(
    `couldn't open the .p12 (wrong password?). openssl said:\n${lastErr}`,
  );
}

// --- Normalise a private key (encrypted/DER/PEM/PKCS#8) to a clean, decrypted
// PKCS#8 PEM. Doubles as a validity check.
function keyToPem(path: string, password?: string): string {
  const args = ["pkey", "-in", path];
  if (password) args.push("-passin", `pass:${password}`);
  try {
    return openssl(args).toString("utf8").trim() + "\n";
  } catch (e: any) {
    die(`couldn't read the private key at ${path}: ${e.stderr || e.message}`);
  }
}

function normaliseKeyPem(keyPem: string, password?: string): string {
  const p = tmp("key.in.pem", keyPem);
  return keyToPem(p, password);
}

// --- Sanity checks: key matches cert, cert not expired. ----------------------
function modulus(kind: "x509" | "rsa", pemPath: string): string | null {
  try {
    const out = openssl([kind, "-noout", "-modulus", "-in", pemPath]).toString(
      "utf8",
    );
    return out.trim();
  } catch {
    return null; // e.g. EC key — skip the match check rather than fail
  }
}

function certEndDate(pemPath: string): Date | null {
  try {
    const out = openssl([
      "x509",
      "-noout",
      "-enddate",
      "-in",
      pemPath,
    ]).toString("utf8");
    const m = out.match(/notAfter=(.+)/);
    return m ? new Date(m[1].trim()) : null;
  } catch {
    return null;
  }
}

function certSubject(pemPath: string): string {
  try {
    return openssl(["x509", "-noout", "-subject", "-in", pemPath])
      .toString("utf8")
      .replace(/^subject=?/, "")
      .trim();
  } catch {
    return "(unknown)";
  }
}

function b64(pem: string): string {
  return Buffer.from(pem, "utf8").toString("base64");
}

function main() {
  const passTypeId = arg("--pass-type-id");
  const teamId = arg("--team-id");
  const wwdrPath = arg("--wwdr");
  const p12Path = arg("--p12");
  const certPath = arg("--cert");
  const keyPath = arg("--key");
  const outPath =
    arg("--out") || join(homedir(), ".config/brewstamp/apple-wallet.env");

  if (!wwdrPath) die("--wwdr <AppleWWDRCAG4.cer> is required");
  if (!p12Path && !(certPath && keyPath))
    die("provide either --p12 <file>, or both --cert <file> and --key <file>");
  if (!passTypeId)
    console.warn("⚠ --pass-type-id not given; leaving APPLE_PASS_TYPE_ID blank");
  if (!teamId)
    console.warn("⚠ --team-id not given; leaving APPLE_TEAM_ID blank");

  // 1. Resolve cert + key PEMs.
  let certPem: string;
  let keyPem: string;
  if (p12Path) {
    const pw = arg("--p12-password") ?? "";
    const r = fromP12(p12Path, pw);
    certPem = r.certPem;
    keyPem = normaliseKeyPem(r.keyPem);
  } else {
    certPem = certToPem(certPath!, "signing");
    const rawKey = readFileSync(keyPath!);
    keyPem = keyToPem(keyPath!, arg("--key-password"));
    void rawKey;
  }
  const wwdrPem = certToPem(wwdrPath, "WWDR");

  // 2. Validate.
  const certFile = tmp("cert.pem", certPem);
  const keyFile = tmp("key.pem", keyPem);
  const wwdrFile = tmp("wwdr.pem", wwdrPem);

  const certMod = modulus("x509", certFile);
  const keyMod = modulus("rsa", keyFile);
  if (certMod && keyMod && certMod !== keyMod) {
    die("the private key does NOT match the signing certificate.");
  }
  const matchNote =
    certMod && keyMod ? "key matches cert ✓" : "key/cert match not checked (non-RSA?)";

  const end = certEndDate(certFile);
  if (end && end.getTime() < Date.now()) {
    die(`the signing certificate EXPIRED on ${end.toDateString()}.`);
  }
  const wwdrEnd = certEndDate(wwdrFile);

  // 3. Write the env file.
  const lines = [
    "# Apple Wallet signing config — generated by scripts/apple-wallet-setup.ts",
    "# Source locally, and copy each var into DigitalOcean App Platform (encrypted).",
    `APPLE_PASS_TYPE_ID=${passTypeId ?? ""}`,
    `APPLE_TEAM_ID=${teamId ?? ""}`,
    `APPLE_PASS_CERT_BASE64=${b64(certPem)}`,
    `APPLE_PASS_KEY_BASE64=${b64(keyPem)}`,
    `APPLE_WWDR_BASE64=${b64(wwdrPem)}`,
    "",
  ].join("\n");

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, lines, { mode: 0o600 });

  // 4. Report (no secrets).
  console.log("\n✓ Apple Wallet signing material processed.\n");
  console.log(`  Certificate : ${certSubject(certFile)}`);
  console.log(`  Expires     : ${end ? end.toDateString() : "unknown"}`);
  console.log(`  ${matchNote}`);
  console.log(`  WWDR expires: ${wwdrEnd ? wwdrEnd.toDateString() : "unknown"}`);
  console.log(`  Pass Type ID: ${passTypeId ?? "(not set)"}`);
  console.log(`  Team ID     : ${teamId ?? "(not set)"}`);
  console.log(`\n  Wrote env file → ${outPath} (chmod 600)\n`);
  console.log("Next steps:");
  console.log(`  • Dev:  cat ${outPath} >> .env.local   (then restart the dev server)`);
  console.log("  • Prod: add each APPLE_* var to DigitalOcean App Platform → Settings →");
  console.log("          App-Level Environment Variables (mark them encrypted), then redeploy.");
  console.log("  • Ensure NEXT_PUBLIC_APP_URL is your public HTTPS origin.");
  console.log("  • Turn on 'Wallet passes' for a shop in Settings — the Apple badge goes live.\n");

  if (has("--print")) {
    console.log("─".repeat(60));
    console.log(lines);
  }
}

main();
