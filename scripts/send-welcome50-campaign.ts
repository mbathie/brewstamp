/**
 * WELCOME50 campaign — 50% off first payment for recently-signed-up cafes that
 * personalized their card but haven't really launched (<10 stamps, free plan).
 *
 *   npx tsx --env-file=.env.local scripts/send-welcome50-campaign.ts --sample
 *     → sends ONE sample to mbathie@gmail.com
 *   npx tsx --env-file=.env.local scripts/send-welcome50-campaign.ts --send
 *     → sends to the real recipient list (provided inline)
 */
import nodemailer from "nodemailer";

const CODE = "WELCOME50";
const EXPIRES = "18 July 2026";
const APP_URL = "https://brewstamp.app";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const FROM = `"Mark at Brewstamp" <${process.env.EMAIL_FROM || "noreply@brewstamp.app"}>`;

// Deliberately plain, 1:1-looking HTML — no banner image, no button, no code
// box, no List-Unsubscribe header. Those are the signals Gmail uses to bucket
// mail into Promotions; a short personal note from Mark lands in Primary.
function html(shopName: string): string {
  const greeting = shopName ? `Hi ${shopName},` : "Hi there,";
  const link = `${APP_URL}/dashboard/billing`;
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#222222;max-width:560px;">
<p>${greeting}</p>
<p>I run Brewstamp — I noticed you set up your loyalty card recently and took the time to make it yours (the colours, pattern and logo are all in). It looks great.</p>
<p>I wanted to give you a hand getting it live in your cafe. If you decide to upgrade in the next few weeks, I'll knock half off your first month — just pop <strong>${CODE}</strong> in at checkout. It works on any plan and it's good through ${EXPIRES}.</p>
<p>You can do that here: <a href="${link}" style="color:#1155cc;">${link.replace("https://", "")}</a></p>
<p>Print your QR poster, set it on the counter, and you're away. If anything's unclear, just hit reply — it comes straight to me.</p>
<p>Cheers,<br/>Mark<br/>Brewstamp</p>
<p style="font-size:12px;color:#999999;">Not interested in the odd note like this? Just reply and I'll leave you be.</p>
</div>`;
}

async function sendOne(to: string, shopName: string) {
  return transporter.sendMail({
    from: FROM,
    to,
    replyTo: "hello@brewstamp.app",
    subject: "a hand getting your Brewstamp card live",
    html: html(shopName),
    headers: { "X-Mailin-Tag": "welcome50-campaign" },
  });
}

(async () => {
  const mode = process.argv[2];
  if (mode === "--sample") {
    const info = await sendOne("mbathie@gmail.com", "Riverside Roasters");
    console.log("Sample sent:", info.messageId);
    return;
  }
  console.log("No --sample flag; not sending. (Bulk --send wired separately once approved.)");
})();
