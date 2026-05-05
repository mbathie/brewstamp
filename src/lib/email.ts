import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const FROM_ADDR = process.env.EMAIL_FROM || "hello@brewstamp.app";
const FROM = `"Brewstamp" <${FROM_ADDR}>`;
const FROM_PERSONAL = `"Mark at Brewstamp" <${FROM_ADDR}>`;
const REPLY_TO = "hello@brewstamp.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";

const LIST_UNSUBSCRIBE = `<mailto:${REPLY_TO}?subject=unsubscribe>`;

function utm(path: string, campaign: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${APP_URL}${path}${sep}utm_source=brewstamp&utm_medium=email&utm_campaign=${campaign}`;
}

export async function sendResetEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const resetLink = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 24px 16px;">
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1c1917;">Reset your password</h1>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          We received a request to reset the password for your Brewstamp account. Click the button below to choose a new password.
        </p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #78716c; line-height: 1.5;">
          This link will expire in 1 hour. If you didn&rsquo;t request this, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding: 0 24px 32px; text-align: center;">
        <a href="${resetLink}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #1c1917; padding: 24px; text-align: center;">
        <p style="margin: 0 0 4px; color: #a8a29e; font-size: 13px;">Brewstamp &mdash; Digital loyalty cards for coffee shops</p>
        <p style="margin: 0; color: #78716c; font-size: 12px;">&copy; ${new Date().getFullYear()} Brewstamp. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: "Reset your Brewstamp password",
      html,
      headers: { "X-Mailin-Tag": "password-reset" },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send reset email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail({
  to,
  merchantName,
  shopName,
}: {
  to: string;
  merchantName: string;
  shopName: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Brewstamp</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>

    <!-- Welcome -->
    <tr>
      <td style="padding: 32px 24px 16px;">
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1c1917;">Welcome aboard, ${merchantName}!</h1>
        <p style="margin: 0; font-size: 16px; color: #57534e; line-height: 1.6;">
          <strong>${shopName}</strong> is all set up on Brewstamp. Here&rsquo;s how to get your digital loyalty card in front of customers in the next few minutes.
        </p>
      </td>
    </tr>

    <!-- Steps -->
    <tr>
      <td style="padding: 8px 24px;">
        <!-- Step 1 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top; padding-right: 14px;">
                    <div style="background-color: #d97706; color: #ffffff; width: 28px; height: 28px; border-radius: 14px; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">1</div>
                  </td>
                  <td>
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Print and display your QR code</h3>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #78716c; line-height: 1.5;">Download your unique QR code from the dashboard, print it out and place it at your point of sale so customers can easily scan it on their phones.</p>
                    <img src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-cafe-qr.jpg" alt="QR code printed out on a cafe counter" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 8px; margin: 0 0 12px;" />
                    <a href="${utm("/dashboard", "welcome")}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Download QR Code &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top; padding-right: 14px;">
                    <div style="background-color: #d97706; color: #ffffff; width: 28px; height: 28px; border-radius: 14px; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">2</div>
                  </td>
                  <td>
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Customise your branding</h3>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #78716c; line-height: 1.5;">Add your logo, pick your brand colours, and set how many stamps earn a free drink. Make it yours.</p>
                    <img src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-loyalty-card.png" alt="Example branded loyalty card" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 8px; margin: 0 0 12px;" />
                    <a href="${utm("/dashboard/settings", "welcome")}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Customise Settings &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 3 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top; padding-right: 14px;">
                    <div style="background-color: #d97706; color: #ffffff; width: 28px; height: 28px; border-radius: 14px; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">3</div>
                  </td>
                  <td>
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Approve stamps from your device</h3>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #78716c; line-height: 1.5;">Keep a phone or tablet logged into your Brewstamp dashboard at the counter. When a customer scans, a stamp request pops up instantly &mdash; tap approve and they get their stamp in real-time.</p>
                    <!-- Device icons -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                      <tr>
                        <td style="padding-right: 8px;">
                          <div style="display: inline-block; background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 8px 14px; text-align: center;">
                            <img src="https://img.icons8.com/color/48/iphone-x.png" alt="iPhone" width="32" height="32" style="display: block; margin: 0 auto 4px;" />
                            <span style="font-size: 11px; color: #78716c; font-weight: 500;">iPhone</span>
                          </div>
                        </td>
                        <td style="padding-right: 8px;">
                          <div style="display: inline-block; background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 8px 14px; text-align: center;">
                            <img src="https://img.icons8.com/color/48/ipad.png" alt="iPad" width="32" height="32" style="display: block; margin: 0 auto 4px;" />
                            <span style="font-size: 11px; color: #78716c; font-weight: 500;">iPad</span>
                          </div>
                        </td>
                        <td style="padding-right: 8px;">
                          <div style="display: inline-block; background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 8px 14px; text-align: center;">
                            <img src="https://img.icons8.com/color/48/android-os.png" alt="Android" width="32" height="32" style="display: block; margin: 0 auto 4px;" />
                            <span style="font-size: 11px; color: #78716c; font-weight: 500;">Android</span>
                          </div>
                        </td>
                        <td>
                          <div style="display: inline-block; background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 8px 14px; text-align: center;">
                            <img src="https://img.icons8.com/color/48/laptop.png" alt="Laptop" width="32" height="32" style="display: block; margin: 0 auto 4px;" />
                            <span style="font-size: 11px; color: #78716c; font-weight: 500;">Laptop</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <a href="${utm("/dashboard", "welcome")}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Open Dashboard &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Pricing -->
    <tr>
      <td style="padding: 8px 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; border-radius: 8px; border: 1px solid #e7e5e4;">
          <tr>
            <td style="padding: 20px;">
              <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1c1917;">Pricing</h3>
              <p style="margin: 0; font-size: 14px; color: #78716c; line-height: 1.6;">
                Brewstamp is <strong style="color: #1c1917;">free to use</strong> for your first 100 stamps. After that, it&rsquo;s just <strong style="color: #1c1917;">$5/month</strong> for unlimited stamps and full access to customer insights. No contracts, cancel anytime.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding: 0 24px 32px; text-align: center;">
        <a href="${utm("/dashboard", "welcome")}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Go to your Dashboard</a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #1c1917; padding: 24px; text-align: center;">
        <p style="margin: 0 0 4px; color: #a8a29e; font-size: 13px;">Brewstamp &mdash; Digital loyalty cards for coffee shops</p>
        <p style="margin: 0; color: #78716c; font-size: 12px;">&copy; ${new Date().getFullYear()} Brewstamp. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      replyTo: REPLY_TO,
      to,
      subject: `Welcome to Brewstamp, ${merchantName}!`,
      html,
      headers: {
        "X-Mailin-Tag": "welcome",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error);
    return { success: false, error };
  }
}

export async function sendPaymentReceiptEmail({
  to,
  merchantName,
  shopName,
  amount,
  currency,
  invoiceDate,
  periodEnd,
}: {
  to: string;
  merchantName: string;
  shopName: string;
  amount: number;
  currency: string;
  invoiceDate: Date;
  periodEnd: Date;
}) {
  const formattedAmount = `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  const formattedDate = invoiceDate.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedPeriodEnd = periodEnd.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 24px 16px;">
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1c1917;">Payment Receipt</h1>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          Hi ${merchantName}, here&rsquo;s your receipt for <strong>${shopName}</strong>&rsquo;s Brewstamp Pro subscription.
        </p>
      </td>
    </tr>

    <!-- Receipt details -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #e7e5e4;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 14px; color: #78716c;">Plan</td>
                  <td style="font-size: 14px; color: #1c1917; text-align: right; font-weight: 600;">Brewstamp Pro</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #e7e5e4;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 14px; color: #78716c;">Amount</td>
                  <td style="font-size: 14px; color: #1c1917; text-align: right; font-weight: 600;">${formattedAmount}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #e7e5e4;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 14px; color: #78716c;">Date</td>
                  <td style="font-size: 14px; color: #1c1917; text-align: right;">${formattedDate}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 14px; color: #78716c;">Next billing date</td>
                  <td style="font-size: 14px; color: #1c1917; text-align: right;">${formattedPeriodEnd}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Manage -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <p style="margin: 0; font-size: 14px; color: #78716c; line-height: 1.5; text-align: center;">
          Manage your subscription anytime from your <a href="${utm("/dashboard/billing", "payment-receipt")}" style="color: #d97706; text-decoration: none; font-weight: 500;">billing dashboard</a>.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #1c1917; padding: 24px; text-align: center;">
        <p style="margin: 0 0 4px; color: #a8a29e; font-size: 13px;">Brewstamp &mdash; Digital loyalty cards for coffee shops</p>
        <p style="margin: 0; color: #78716c; font-size: 12px;">&copy; ${new Date().getFullYear()} Brewstamp. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      replyTo: REPLY_TO,
      to,
      subject: `Brewstamp Pro receipt \u2014 ${formattedAmount} on ${formattedDate}`,
      html,
      headers: { "X-Mailin-Tag": "receipt" },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send payment receipt:", error);
    return { success: false, error };
  }
}

export async function sendDay3NudgeEmail({
  to,
  merchantName,
  shopName,
}: {
  to: string;
  merchantName: string;
  shopName: string;
}) {
  const dashboardLink = utm("/dashboard", "drip-day3");

  const text = `Hey ${merchantName},

Just checking in on ${shopName} \u2014 saw you set things up a few days ago.

If you have a sec, the one thing that gets the ball rolling is printing your QR code and putting it somewhere customers can see it (next to the register works well). You can grab the PDF here:

${dashboardLink}

If you've hit a snag with anything, just reply to this email and I'll help you sort it out.

Cheers,
Mark
Brewstamp`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1c1917;">
  <div style="max-width: 560px; margin: 0 auto; font-size: 16px; line-height: 1.6;">
    <p style="margin: 0 0 16px;">Hey ${merchantName},</p>
    <p style="margin: 0 0 16px;">Just checking in on <strong>${shopName}</strong> &mdash; saw you set things up a few days ago.</p>
    <p style="margin: 0 0 16px;">If you have a sec, the one thing that gets the ball rolling is printing your QR code and putting it somewhere customers can see it (next to the register works well). You can grab the PDF here:</p>
    <p style="margin: 0 0 16px;"><a href="${dashboardLink}" style="color: #b45309;">${APP_URL.replace(/^https?:\/\//, "")}/dashboard</a></p>
    <p style="margin: 0 0 16px;">If you&rsquo;ve hit a snag with anything, just reply to this email and I&rsquo;ll help you sort it out.</p>
    <p style="margin: 0 0 4px;">Cheers,<br/>Mark<br/><span style="color: #78716c; font-size: 14px;">Brewstamp</span></p>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM_PERSONAL,
      replyTo: REPLY_TO,
      to,
      subject: `Quick check-in on ${shopName}`,
      text,
      html,
      headers: {
        "X-Mailin-Tag": "drip-day3",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send day 3 nudge email:", error);
    return { success: false, error };
  }
}

export async function sendDay7FollowUpEmail({
  to,
  merchantName,
  shopName,
  stamps = 0,
}: {
  to: string;
  merchantName: string;
  shopName: string;
  stamps?: number;
}) {
  const dashboardLink = utm("/dashboard", "drip-day7");
  const stampsLine = stamps > 0
    ? `You&rsquo;ve had ${stamps} stamp${stamps === 1 ? "" : "s"} come through so far &mdash; nice start.`
    : `Your loyalty card is live, just no stamps through yet.`;
  const stampsLineText = stamps > 0
    ? `You've had ${stamps} stamp${stamps === 1 ? "" : "s"} come through so far \u2014 nice start.`
    : `Your loyalty card is live, just no stamps through yet.`;

  const text = `Hey ${merchantName},

It's been about a week since you set up ${shopName}. ${stampsLineText}

If you'd like, I'm happy to jump on a quick call (or just trade emails) and walk through what's working for other cafes \u2014 what to put on the counter, how to mention it at checkout, that sort of thing. No pitch, just whatever is useful.

Just reply to this email and let me know.

Otherwise, here's your dashboard if you want to poke around:
${dashboardLink}

Cheers,
Mark
Brewstamp`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1c1917;">
  <div style="max-width: 560px; margin: 0 auto; font-size: 16px; line-height: 1.6;">
    <p style="margin: 0 0 16px;">Hey ${merchantName},</p>
    <p style="margin: 0 0 16px;">It&rsquo;s been about a week since you set up <strong>${shopName}</strong>. ${stampsLine}</p>
    <p style="margin: 0 0 16px;">If you&rsquo;d like, I&rsquo;m happy to jump on a quick call (or just trade emails) and walk through what&rsquo;s working for other cafes &mdash; what to put on the counter, how to mention it at checkout, that sort of thing. No pitch, just whatever is useful.</p>
    <p style="margin: 0 0 16px;">Just reply to this email and let me know.</p>
    <p style="margin: 0 0 16px;">Otherwise, here&rsquo;s your dashboard if you want to poke around:<br/><a href="${dashboardLink}" style="color: #b45309;">${APP_URL.replace(/^https?:\/\//, "")}/dashboard</a></p>
    <p style="margin: 0 0 4px;">Cheers,<br/>Mark<br/><span style="color: #78716c; font-size: 14px;">Brewstamp</span></p>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM_PERSONAL,
      replyTo: REPLY_TO,
      to,
      subject: `Want a hand getting ${shopName} going?`,
      text,
      html,
      headers: {
        "X-Mailin-Tag": "drip-day7",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send day 7 follow-up email:", error);
    return { success: false, error };
  }
}

export async function sendDay14ReengagementEmail({
  to,
  merchantName,
  shopName,
  stamps = 0,
}: {
  to: string;
  merchantName: string;
  shopName: string;
  stamps?: number;
}) {
  const dashboardLink = utm("/dashboard", "drip-day14");
  const stampsLine = stamps > 0
    ? `You&rsquo;ve had ${stamps} stamp${stamps === 1 ? "" : "s"} come through, so something&rsquo;s working.`
    : `I noticed you haven&rsquo;t had any stamps come through yet.`;
  const stampsLineText = stamps > 0
    ? `You've had ${stamps} stamp${stamps === 1 ? "" : "s"} come through, so something's working.`
    : `I noticed you haven't had any stamps come through yet.`;

  const text = `Hey ${merchantName},

It's been a couple of weeks since you set up ${shopName}. ${stampsLineText}

If something has been getting in the way — printing the QR code, getting it in front of customers, anything else — let me know. Genuinely happy to help you sort it out, or to hear it's just not the right fit. Either is useful.

Just hit reply.

Cheers,
Mark
Brewstamp

(Dashboard: ${dashboardLink})`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1c1917;">
  <div style="max-width: 560px; margin: 0 auto; font-size: 16px; line-height: 1.6;">
    <p style="margin: 0 0 16px;">Hey ${merchantName},</p>
    <p style="margin: 0 0 16px;">It&rsquo;s been a couple of weeks since you set up <strong>${shopName}</strong>. ${stampsLine}</p>
    <p style="margin: 0 0 16px;">If something has been getting in the way &mdash; printing the QR code, getting it in front of customers, anything else &mdash; let me know. Genuinely happy to help you sort it out, or to hear it&rsquo;s just not the right fit. Either is useful.</p>
    <p style="margin: 0 0 16px;">Just hit reply.</p>
    <p style="margin: 0 0 4px;">Cheers,<br/>Mark<br/><span style="color: #78716c; font-size: 14px;">Brewstamp</span></p>
    <p style="margin: 24px 0 0; font-size: 13px; color: #78716c;">Dashboard: <a href="${dashboardLink}" style="color: #78716c;">${APP_URL.replace(/^https?:\/\//, "")}/dashboard</a></p>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM_PERSONAL,
      replyTo: REPLY_TO,
      to,
      subject: `Need a hand setting up ${shopName}?`,
      text,
      html,
      headers: {
        "X-Mailin-Tag": "drip-day14",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send day 14 re-engagement email:", error);
    return { success: false, error };
  }
}

export async function sendUpgradeNudgeEmail({
  to,
  merchantName,
  shopName,
  stampsUsed,
}: {
  to: string;
  merchantName: string;
  shopName: string;
  stampsUsed: number;
}) {
  const stampsRemaining = 100 - stampsUsed;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stamp limit update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 24px 24px;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #1c1917; line-height: 1.6;">
          Hi ${merchantName},
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          Just a heads up &mdash; <strong>${shopName}</strong> has used <strong>${stampsUsed} of 100</strong> free stamps. You have <strong>${stampsRemaining} left</strong> before new stamp requests are paused.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          ${stampsUsed} stamps means customers are coming back &mdash; your loyalty card is doing its job. To keep things running without interruption, you can switch to the unlimited plan ($5/mo) from your billing page:
        </p>
        <p style="margin: 0 0 24px; font-size: 16px;">
          <a href="${utm("/dashboard/billing", "drip-upgrade")}" style="color: #d97706; text-decoration: underline;">${APP_URL}/dashboard/billing</a>
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          No rush &mdash; everything keeps working until you hit 100. Just wanted to make sure you&rsquo;re not caught off guard.
        </p>
        <p style="margin: 0; font-size: 16px; color: #57534e; line-height: 1.6;">
          Cheers,<br/>The Brewstamp team
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #1c1917; padding: 24px; text-align: center;">
        <p style="margin: 0 0 4px; color: #a8a29e; font-size: 13px;">Brewstamp &mdash; Digital loyalty cards for coffee shops</p>
        <p style="margin: 0; color: #78716c; font-size: 12px;">&copy; ${new Date().getFullYear()} Brewstamp. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${merchantName},

Just a heads up \u2014 ${shopName} has used ${stampsUsed} of 100 free stamps. You have ${stampsRemaining} left before new stamp requests are paused.

${stampsUsed} stamps means customers are coming back \u2014 your loyalty card is doing its job. To keep things running without interruption, you can switch to the unlimited plan ($5/mo) from your billing page:

${utm("/dashboard/billing", "drip-upgrade")}

No rush \u2014 everything keeps working until you hit 100. Just wanted to make sure you're not caught off guard.

Cheers,
The Brewstamp team`;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      replyTo: REPLY_TO,
      to,
      subject: `${shopName} \u2014 ${stampsRemaining} free stamps remaining`,
      text,
      html,
      headers: {
        "X-Mailin-Tag": "drip-upgrade",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send upgrade nudge email:", error);
    return { success: false, error };
  }
}

export async function sendReferralRewardEmail({
  to,
  merchantName,
  referredShopName,
}: {
  to: string;
  merchantName: string;
  referredShopName: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral reward</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 24px 24px;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #1c1917; line-height: 1.6;">
          Hi ${merchantName},
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          Great news &mdash; <strong>${referredShopName}</strong> just upgraded to Brewstamp Pro through your referral link!
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          As a thank you, we&rsquo;ve added a <strong>$10 credit</strong> to your account &mdash; that&rsquo;s <strong>2 free months</strong> of Pro on us. The credit will be automatically applied to your next invoices.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          Keep sharing your referral link to earn more rewards:
        </p>
        <p style="margin: 0 0 24px; font-size: 16px;">
          <a href="${utm("/dashboard/referrals", "referral-reward")}" style="color: #d97706; text-decoration: underline;">${APP_URL}/dashboard/referrals</a>
        </p>
        <p style="margin: 0; font-size: 16px; color: #57534e; line-height: 1.6;">
          Cheers,<br/>The Brewstamp team
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #1c1917; padding: 24px; text-align: center;">
        <p style="margin: 0 0 4px; color: #a8a29e; font-size: 13px;">Brewstamp &mdash; Digital loyalty cards for coffee shops</p>
        <p style="margin: 0; color: #78716c; font-size: 12px;">&copy; ${new Date().getFullYear()} Brewstamp. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      replyTo: REPLY_TO,
      to,
      subject: `Your referral just upgraded \u2014 you earned 2 free months!`,
      html,
      headers: { "X-Mailin-Tag": "referral-reward" },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send referral reward email:", error);
    return { success: false, error };
  }
}
