/**
 * Cold-pitch the Bondi cafe customer story to publications via Brevo.
 *
 * Sends one personalized email per recipient. Recipients come from a
 * gitignored JSON file you control — the script refuses to send to anyone
 * not in that file.
 *
 * Setup
 * -----
 * 1. hello@brewstamp.app must be a VERIFIED sender in Brevo. If it isn't,
 *    add it via Brevo dashboard → Senders → Add a new sender (you'll
 *    receive a one-time confirmation email). The script uses this as the
 *    From: header; Brevo rejects unverified From addresses with 550.
 *
 * 2. Create ~/.config/brewstamp/pitch-targets.json:
 *
 *      {
 *        "subject": "Bondi cafe pulled 863 customers onto a QR loyalty card in 7 months",
 *        "targets": [
 *          {
 *            "publication": "Hospitality Magazine AU",
 *            "editorName": "Laura",
 *            "email": "lbox@intermedia.com.au"
 *          },
 *          ...
 *        ]
 *      }
 *
 *    Only entries with a non-empty email are sent. Verify each address before
 *    adding — bouncing pitches damages your transactional sender reputation.
 *
 * 3. Run with --dry-run first to preview the rendered emails:
 *
 *      npx tsx scripts/pitch-bondi-story.ts --dry-run
 *
 * 4. When happy, send for real:
 *
 *      npx tsx scripts/pitch-bondi-story.ts --send
 *
 *    A "Did you mean to send live emails?" guard prevents accidental sends.
 *    Results log to ~/.config/brewstamp/pitch-log.jsonl.
 */
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import nodemailer from "nodemailer";

interface Target {
  publication: string;
  editorName: string;
  email: string;
  notes?: string;
}

interface Config {
  subject: string;
  targets: Target[];
}

const CONFIG_PATH = join(homedir(), ".config/brewstamp/pitch-targets.json");
const LOG_PATH = join(homedir(), ".config/brewstamp/pitch-log.jsonl");

const FROM_NAME = "Mark Bathie";
const FROM_ADDR = "hello@brewstamp.app";
const FROM = `"${FROM_NAME}" <${FROM_ADDR}>`;
const REPLY_TO = "hello@brewstamp.app";
const POST_URL = "https://brewstamp.app/blog/bennett-st-dairy-bondi";

const isDryRun = process.argv.includes("--dry-run");
const isSend = process.argv.includes("--send");

if (!isDryRun && !isSend) {
  console.error(
    "Pass --dry-run to preview or --send to actually send. " +
      "Refusing to default to sending.",
  );
  process.exit(1);
}

function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    console.error(
      `Missing ${CONFIG_PATH}. See the comment at the top of this script for format.`,
    );
    process.exit(1);
  }
  const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Config;
  if (!cfg.subject || !Array.isArray(cfg.targets)) {
    throw new Error("pitch-targets.json must have `subject` and `targets`.");
  }
  return cfg;
}

// Plain-text body. We send plaintext only — no HTML — because (a) text
// pitches read more like a human wrote them, and (b) plain text dodges the
// promotional-folder filter most editors' inboxes apply to HTML email.
function renderBody(t: Target): string {
  return `Hi ${t.editorName},

I'm Mark Bathie, founder of Brewstamp — a free QR-based loyalty card
for cafes. Wanted to send through a customer story that might be a fit
for ${t.publication}.

Bennett St Dairy in Bondi has been running a digital loyalty card for
seven months. The numbers, as of last week:

  - 863 customers enrolled (no app downloads required — just a QR scan)
  - 4,940 stamps awarded
  - 121 of those customers are actively scanning weekly
  - "Buy 7, get 1 free" — same rule as their old paper card
  - One A4 QR poster on the counter replaced a box of printed punch cards

What I think is actually pitch-worthy: the loyalty data shows daily
regulars hit the reward inside two weeks, which has shifted how the
cafe thinks about staff rosters and quiet-period offers. That's
visibility a paper punch card can't give you.

The full case study is already published on our site:
  ${POST_URL}

You're welcome to quote or reference it directly. I'm also happy to:
  - share the underlying anonymized data across our other cafe customers
  - send photos of the counter setup
  - write a 600-word contributed piece you can edit
  - just shut up and let you take it from here

Happy to slow this down if it doesn't fit your editorial calendar.

Mark
Brewstamp · brewstamp.app
hello@brewstamp.app
`;
}

async function main() {
  const cfg = loadConfig();
  const valid = cfg.targets.filter((t) => t.email && t.email.includes("@"));
  const skipped = cfg.targets.length - valid.length;
  if (skipped > 0) {
    console.warn(`Skipping ${skipped} target(s) with no valid email.`);
  }
  if (valid.length === 0) {
    console.error("No valid targets to send to.");
    process.exit(1);
  }

  console.log(`\nSubject: ${cfg.subject}`);
  console.log(`From:    ${FROM}`);
  console.log(`Mode:    ${isDryRun ? "DRY RUN (no emails sent)" : "LIVE SEND"}`);
  console.log(`Targets: ${valid.length}\n`);

  if (isSend) {
    // 5-second pause so a stray --send gives the operator time to bail.
    console.log("Sending in 5 seconds — Ctrl+C to abort…");
    await new Promise((r) => setTimeout(r, 5000));
  }

  const transporter = isSend
    ? nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })
    : null;

  for (const t of valid) {
    const body = renderBody(t);
    console.log("─".repeat(72));
    console.log(`To: ${t.editorName} <${t.email}> · ${t.publication}`);
    if (isDryRun) {
      console.log();
      console.log(body);
      continue;
    }
    try {
      const info = await transporter!.sendMail({
        from: FROM,
        replyTo: REPLY_TO,
        to: t.email,
        subject: cfg.subject,
        text: body,
        // No HTML body on purpose — keeps the email looking personal.
      });
      console.log(`✓ Sent (messageId: ${info.messageId})`);
      appendFileSync(
        LOG_PATH,
        JSON.stringify({
          ts: new Date().toISOString(),
          publication: t.publication,
          editorName: t.editorName,
          email: t.email,
          messageId: info.messageId,
          status: "sent",
        }) + "\n",
      );
    } catch (err) {
      const msg = (err as Error).message;
      console.log(`✗ Failed: ${msg}`);
      appendFileSync(
        LOG_PATH,
        JSON.stringify({
          ts: new Date().toISOString(),
          publication: t.publication,
          editorName: t.editorName,
          email: t.email,
          status: "failed",
          error: msg,
        }) + "\n",
      );
    }
    // 2-second pause between recipients so we don't trip any per-second
    // rate limits and to space out volume to Brevo.
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\nDone.");
  if (!isDryRun) {
    console.log(`Log: ${LOG_PATH}`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
