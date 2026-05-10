// One-off announcement: multi-language support for the customer card.
// First sends to PREVIEW_TO only. Switch SEND_LIVE=1 + run with the
// real recipient list when ready to fan out to all shop owners.
//
//   npx ts-node --project tsconfig.server.json scripts/send-multilang-announce.ts

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import nodemailer from "nodemailer";

const FROM_ADDR = process.env.EMAIL_FROM || "noreply@brewstamp.app";
const FROM_PERSONAL = `"Mark at Brewstamp" <${FROM_ADDR}>`;
const REPLY_TO = "hello@brewstamp.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";
const LIST_UNSUBSCRIBE = `<mailto:${REPLY_TO}?subject=unsubscribe>`;

const PREVIEW_TO = "mbathie@gmail.com";

const SUBJECT = "Brewstamp now speaks 10 languages 🌍";

const blogLink = `${APP_URL}/blog/multi-language-loyalty-card?utm_source=brewstamp&utm_medium=email&utm_campaign=multilang-launch`;
const settingsLink = `${APP_URL}/dashboard/settings?utm_source=brewstamp&utm_medium=email&utm_campaign=multilang-launch`;

const LANGUAGES = [
  ["🇺🇸", "English"],
  ["🇪🇸", "Español"],
  ["🇫🇷", "Français"],
  ["🇩🇪", "Deutsch"],
  ["🇵🇹", "Português"],
  ["🇮🇹", "Italiano"],
  ["🇨🇳", "中文"],
  ["🇯🇵", "日本語"],
  ["🇰🇷", "한국어"],
  ["🇸🇦", "العربية"],
];

function emailText(merchantName: string) {
  return `Hey ${merchantName},

Mark from Brewstamp here. Quick product update — we just shipped multi-language support for your customer-facing loyalty card and the printable QR PDF.

Ten languages, all picked to cover the largest share of cafe customers worldwide:

${LANGUAGES.map(([f, n]) => `  ${f}  ${n}`).join("\n")}

Pick the language that matches your customers and the entire customer experience switches over — buttons, progress text, the "Buy 8, get one free" headline on the printed PDF, all of it. Your dashboard stays in English so you don't have to switch contexts.

How to switch:
  Open Shop Setup → Loyalty → Customer-facing language → pick your language.

Auto-save kicks in 3 seconds later. Re-print your QR PDF and the new language is on it too.

More detail in the launch post:
  ${blogLink}

Or jump straight in:
  ${settingsLink}

If your regulars speak a language we don't yet support, hit reply with the language and we'll prioritise — adding more is cheap once the system's in place.

Cheers,
Mark Bathie
Founder / CEO, Brewstamp
${APP_URL}`;
}

function emailHtml(merchantName: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#ffffff;color:#1c1917;">
  <div style="max-width:560px;margin:0 auto;font-size:16px;line-height:1.6;">
    <p style="margin:0 0 16px;">Hey ${merchantName},</p>
    <p style="margin:0 0 16px;">Mark from Brewstamp here. Quick product update &mdash; we just shipped <strong>multi-language support</strong> for your customer-facing loyalty card and the printable QR PDF.</p>
    <p style="margin:0 0 12px;">Ten languages, picked to cover the largest share of cafe customers worldwide:</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;width:100%;border-collapse:collapse;">
      <tbody>
        ${LANGUAGES.reduce<string[][]>((acc, lang, i) => {
          const row = Math.floor(i / 2);
          if (!acc[row]) acc[row] = [];
          acc[row].push(`${lang[0]}&nbsp;&nbsp;${lang[1]}`);
          return acc;
        }, [])
          .map(
            (cells) =>
              `<tr>${cells
                .map(
                  (c) =>
                    `<td style="padding:8px 12px;border:1px solid #e7e5e4;border-radius:8px;font-size:15px;color:#1c1917;background:#fafaf9;">${c}</td>`
                )
                .join('<td style="width:8px;"></td>')}</tr>`
          )
          .join('<tr><td colspan="3" style="height:8px;"></td></tr>')}
      </tbody>
    </table>
    <p style="margin:0 0 16px;">Pick the language that matches your customers and the entire customer experience switches over &mdash; buttons, progress text, the &ldquo;Buy 8, get one free&rdquo; headline on the printed PDF, all of it. Your dashboard stays in English.</p>
    <p style="margin:0 0 8px;"><strong>How to switch</strong></p>
    <p style="margin:0 0 16px;">Open Shop Setup &rarr; Loyalty &rarr; <em>Customer-facing language</em> &rarr; pick your language. Auto-save kicks in 3 seconds later. Re-print your QR PDF and the new language is on it too.</p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${settingsLink}" style="display:inline-block;background-color:#b45309;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:500;">Switch language now &rarr;</a>
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#78716c;">More detail in the launch post: <a href="${blogLink}" style="color:#b45309;">${blogLink.replace(/^https?:\/\//, "")}</a></p>
    <p style="margin:0 0 16px;">If your regulars speak a language we don&rsquo;t yet support, hit reply with the language and we&rsquo;ll prioritise &mdash; adding more is cheap once the system&rsquo;s in place.</p>
    <p style="margin:24px 0 4px;">Cheers,</p>
    <p style="margin:0;font-size:15px;color:#1c1917;"><strong>Mark Bathie</strong></p>
    <p style="margin:0;font-size:14px;color:#78716c;">Founder / CEO, Brewstamp</p>
    <p style="margin:4px 0 0;"><a href="${APP_URL}" style="color:#b45309;font-size:14px;">${APP_URL.replace(/^https?:\/\//, "")}</a></p>
  </div>
</body></html>`;
}

async function main() {
  if (!process.env.EMAIL_SERVER_HOST) {
    console.error("EMAIL_SERVER_HOST not set; aborting.");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: false,
    auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
  });

  const merchantName = "Mark";

  console.log(`Sending preview to ${PREVIEW_TO}...`);
  const info = await transporter.sendMail({
    from: FROM_PERSONAL,
    replyTo: REPLY_TO,
    to: PREVIEW_TO,
    subject: SUBJECT,
    text: emailText(merchantName),
    html: emailHtml(merchantName),
    headers: {
      "X-Mailin-Tag": "multilang-launch-preview",
      "List-Unsubscribe": LIST_UNSUBSCRIBE,
    },
  });
  console.log(`✅ sent: ${info.messageId}`);
  console.log(`   accepted: ${JSON.stringify(info.accepted)}`);
  console.log(`   rejected: ${JSON.stringify(info.rejected)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
