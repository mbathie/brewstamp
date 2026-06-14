import nodemailer from "nodemailer";
import { getPlanBySlug } from "./plans";

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
        <a href="${resetLink}" style="display: inline-block; background-color: #d97706; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;"><span style="color: #ffffff;">Reset Password</span></a>
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
                    <img src="https://brewstamp.app/cafe-loyalty-counter.jpg" alt="A customer scanning a Brewstamp QR loyalty card on a cafe counter" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 8px; margin: 0 0 12px;" />
                    <a href="${utm("/dashboard", "welcome")}" style="display: inline-block; background-color: #d97706; color: #ffffff !important; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;"><span style="color: #ffffff;">Download QR Code &rarr;</span></a>
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
                    <a href="${utm("/dashboard/settings", "welcome")}" style="display: inline-block; background-color: #d97706; color: #ffffff !important; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;"><span style="color: #ffffff;">Customise Settings &rarr;</span></a>
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
                    <a href="${utm("/dashboard", "welcome")}" style="display: inline-block; background-color: #d97706; color: #ffffff !important; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;"><span style="color: #ffffff;">Open Dashboard &rarr;</span></a>
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
                Brewstamp is <strong style="color: #1c1917;">free to use</strong> for your first 100 stamps. After that, it&rsquo;s just <strong style="color: #1c1917;">$7/month</strong> for unlimited stamps and full access to customer insights. No contracts, cancel anytime.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding: 0 24px 32px; text-align: center;">
        <a href="${utm("/dashboard", "welcome")}" style="display: inline-block; background-color: #d97706; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;"><span style="color: #ffffff;">Go to your Dashboard</span></a>
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

// Sent when a subscription has been unpaid past the grace period and the
// billing cron has dropped the shop back to the Free plan.
export async function sendSubscriptionDowngradedEmail({
  to,
  merchantName,
  shopName,
  daysOverdue,
}: {
  to: string;
  merchantName: string;
  shopName: string;
  daysOverdue: number;
}) {
  const billingUrl = utm("/dashboard/billing", "subscription-downgraded");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Brewstamp plan was paused</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px 16px;">
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1c1917;">Your plan has been paused</h1>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          Hi ${merchantName}, we tried to renew the Brewstamp subscription for
          <strong>${shopName}</strong> but the payment didn&rsquo;t go through, and
          it&rsquo;s now been outstanding for ${daysOverdue} days. We&rsquo;ve moved
          the shop back to the <strong>Free plan</strong> for now.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          Your shop, customers, and stamps are all safe &mdash; nothing has been
          deleted. To restore your paid features, just update your payment method
          and re-subscribe.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 24px 32px; text-align: center;">
        <a href="${billingUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;"><span style="color: #ffffff;">Restore my plan</span></a>
      </td>
    </tr>
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
      subject: `Your Brewstamp plan for ${shopName} has been paused`,
      html,
      headers: { "X-Mailin-Tag": "downgrade" },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send downgrade email:", error);
    return { success: false, error };
  }
}

export async function sendCustomerConsentEmail({
  to,
  shopName,
  location,
}: {
  to: string;
  shopName: string;
  location: string;
}) {
  const text = `Hi ${shopName} team,

Mark from Brewstamp here — you'll know us as the team behind the loyalty card you're running.

We're putting together a small "Trusted by cafes" section on the brewstamp.app homepage, and we'd love to include ${shopName} in it. Just the cafe name and your suburb — for example:

  ${shopName} — ${location}

— under a heading along the lines of "Independent cafes running real loyalty programs with us."

No logos, no testimonial, no commitment. Just a low-key mention so prospective cafes can see we work with real shops in real places.

If you're cool with it, just reply "yes." If you'd rather not, reply "no" and we'll quietly pass — no hard feelings, no follow-up.

Cheers,
Mark Bathie
Founder / CEO, Brewstamp
hello@brewstamp.app`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1c1917;">
  <div style="max-width: 560px; margin: 0 auto; font-size: 16px; line-height: 1.6;">
    <p style="margin: 0 0 16px;">Hi <strong>${shopName}</strong> team,</p>
    <p style="margin: 0 0 16px;">Mark from Brewstamp here &mdash; you&rsquo;ll know us as the team behind the loyalty card you&rsquo;re running.</p>
    <p style="margin: 0 0 16px;">We&rsquo;re putting together a small &ldquo;Trusted by cafes&rdquo; section on the <a href="https://brewstamp.app" style="color: #b45309;">brewstamp.app</a> homepage, and we&rsquo;d love to include <strong>${shopName}</strong> in it. Just the cafe name and your suburb &mdash; for example:</p>
    <p style="margin: 0 0 16px; padding: 12px 16px; background-color: #fafaf9; border-left: 3px solid #d97706; border-radius: 4px; font-size: 15px;"><strong>${shopName}</strong> &mdash; ${location}</p>
    <p style="margin: 0 0 16px;">&mdash; under a heading along the lines of &ldquo;Independent cafes running real loyalty programs with us.&rdquo;</p>
    <p style="margin: 0 0 16px;">No logos, no testimonial, no commitment. Just a low-key mention so prospective cafes can see we work with real shops in real places.</p>
    <p style="margin: 0 0 16px;">If you&rsquo;re cool with it, just reply &ldquo;yes.&rdquo; If you&rsquo;d rather not, reply &ldquo;no&rdquo; and we&rsquo;ll quietly pass &mdash; no hard feelings, no follow-up.</p>
    <p style="margin: 24px 0 4px;">Cheers,</p>
    <p style="margin: 0; font-size: 15px; color: #1c1917;"><strong>Mark Bathie</strong></p>
    <p style="margin: 0; font-size: 14px; color: #78716c;">Founder / CEO, Brewstamp</p>
    <p style="margin: 4px 0 0; font-size: 14px; color: #78716c;">hello@brewstamp.app</p>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM_PERSONAL,
      replyTo: REPLY_TO,
      to,
      subject: `Quick ask — featuring ${shopName} on brewstamp.app?`,
      text,
      html,
      headers: {
        "X-Mailin-Tag": "customer-consent",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send customer consent email:", error);
    return { success: false, error };
  }
}

export async function sendFirstCustomerEmail({
  to,
  merchantName,
  shopName,
}: {
  to: string;
  merchantName: string;
  shopName: string;
}) {
  const dashboardLink = utm("/dashboard", "first-customer");

  const text = `Hey ${merchantName},

You just stamped your first customer at ${shopName} — congrats. The hardest part of running a loyalty program is the first stamp; everything from here is repetition.

A few things worth knowing now that you're live:

- Every stamp shows up on your dashboard for approval before it lands. If a customer tries to scan twice for the same coffee, you can just hit reject.
- The "Customers" tab will start filling up as more regulars scan in. After a couple of weeks you'll see who your most loyal customers are.
- When someone hits your stamp threshold, they'll get a free-drink notification automatically — no extra step from you.

If anything's confusing or you've got feedback on what could be better, hit reply — it goes straight to me.

Cheers,
Mark Bathie
Founder / CEO, Brewstamp
${dashboardLink}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1c1917;">
  <div style="max-width: 560px; margin: 0 auto; font-size: 16px; line-height: 1.6;">
    <p style="margin: 0 0 16px;">Hey ${merchantName},</p>
    <p style="margin: 0 0 16px;">You just stamped your first customer at <strong>${shopName}</strong> &mdash; congrats. The hardest part of running a loyalty program is the first stamp; everything from here is repetition.</p>
    <p style="margin: 0 0 8px;">A few things worth knowing now that you&rsquo;re live:</p>
    <ul style="margin: 0 0 16px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Every stamp shows up on your dashboard for approval before it lands. If a customer tries to scan twice for the same coffee, you can just hit reject.</li>
      <li style="margin-bottom: 8px;">The &ldquo;Customers&rdquo; tab will start filling up as more regulars scan in. After a couple of weeks you&rsquo;ll see who your most loyal customers are.</li>
      <li style="margin-bottom: 8px;">When someone hits your stamp threshold, they&rsquo;ll get a free-drink notification automatically &mdash; no extra step from you.</li>
    </ul>
    <p style="margin: 0 0 16px;">If anything&rsquo;s confusing or you&rsquo;ve got feedback on what could be better, hit reply &mdash; it goes straight to me.</p>
    <p style="margin: 24px 0 4px;">Cheers,</p>
    <p style="margin: 0; font-size: 15px; color: #1c1917;"><strong>Mark Bathie</strong></p>
    <p style="margin: 0; font-size: 14px; color: #78716c;">Founder / CEO, Brewstamp</p>
    <p style="margin: 4px 0 0;"><a href="${dashboardLink}" style="color: #b45309; font-size: 14px;">${APP_URL.replace(/^https?:\/\//, "")}/dashboard</a></p>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM_PERSONAL,
      replyTo: REPLY_TO,
      to,
      subject: `${shopName} just stamped its first customer 🎉`,
      text,
      html,
      headers: {
        "X-Mailin-Tag": "first-customer",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send first-customer email:", error);
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
  const freePlan = getPlanBySlug("free")!;
  const proPlan = getPlanBySlug("pro")!;
  const freeStampLimit = freePlan.stampLimit as number;
  const proPriceLabel = proPlan.priceLabel;
  const stampsRemaining = freeStampLimit - stampsUsed;
  const billingLink = utm("/dashboard/billing", "drip-upgrade");

  const text = `Hey ${merchantName},

Quick heads-up \u2014 ${shopName} has used ${stampsUsed} of ${freeStampLimit} free stamps. You've got ${stampsRemaining} left before new stamp requests get paused.

${stampsUsed} stamps means customers are coming back, which is great. To keep things running without interruption, you can switch to the unlimited plan (${proPriceLabel}/mo) from your billing page:

${billingLink}

No rush \u2014 everything keeps working until you hit ${freeStampLimit}. Just didn't want you caught off guard.

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
    <p style="margin: 0 0 16px;">Quick heads-up &mdash; <strong>${shopName}</strong> has used <strong>${stampsUsed} of ${freeStampLimit}</strong> free stamps. You&rsquo;ve got <strong>${stampsRemaining} left</strong> before new stamp requests get paused.</p>
    <p style="margin: 0 0 16px;">${stampsUsed} stamps means customers are coming back, which is great. To keep things running without interruption, you can switch to the unlimited plan (${proPriceLabel}/mo) from your billing page:</p>
    <p style="margin: 0 0 16px;"><a href="${billingLink}" style="color: #b45309;">${APP_URL.replace(/^https?:\/\//, "")}/dashboard/billing</a></p>
    <p style="margin: 0 0 16px;">No rush &mdash; everything keeps working until you hit ${freeStampLimit}. Just didn&rsquo;t want you caught off guard.</p>
    <p style="margin: 0 0 4px;">Cheers,<br/>Mark<br/><span style="color: #78716c; font-size: 14px;">Brewstamp</span></p>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM_PERSONAL,
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

export async function sendTeamInviteEmail({
  to,
  shopName,
  inviterName,
  role,
  token,
}: {
  to: string;
  shopName: string;
  inviterName: string;
  role: "manager" | "staff";
  token: string;
}) {
  const acceptLink = `${APP_URL}/invite/${encodeURIComponent(token)}`;
  const roleLabel = role === "manager" ? "manager" : "staff member";

  const text = `Hi,

${inviterName} has invited you to join ${shopName} on Brewstamp as a ${roleLabel}.

Accept the invite by clicking the link below — you'll be asked to sign in (or create an account) with this email address (${to}):

${acceptLink}

This invite expires in 7 days.

Cheers,
The Brewstamp team`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${shopName} on Brewstamp</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px 8px;">
        <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #1c1917;">You&rsquo;ve been invited</h1>
        <p style="margin: 0 0 16px; font-size: 16px; color: #57534e; line-height: 1.6;">
          <strong>${inviterName}</strong> has invited you to join <strong>${shopName}</strong> on Brewstamp as a <strong>${roleLabel}</strong>.
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; color: #78716c; line-height: 1.6;">
          Accept the invite below &mdash; you&rsquo;ll be asked to sign in (or create an account) with this email address (${to}).
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 24px 32px; text-align: center;">
        <a href="${acceptLink}" style="display: inline-block; background-color: #d97706; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;"><span style="color: #ffffff;">Accept Invite</span></a>
        <p style="margin: 16px 0 0; font-size: 12px; color: #a8a29e;">This invite expires in 7 days.</p>
      </td>
    </tr>
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
      subject: `${inviterName} invited you to join ${shopName} on Brewstamp`,
      text,
      html,
      headers: {
        "X-Mailin-Tag": "team-invite",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send team invite email:", error);
    return { success: false, error };
  }
}

// Behaviour-triggered "go live" nudge — replaces the old day-1/3/7/14 calendar
// drip. Sent once to shops that set up + tested their card but never went live.
// Localised by the shop's language (en fallback), RTL-aware for Arabic.
export async function sendGoLiveNudgeEmail({
  to,
  merchantName,
  shopName,
  language = "en",
}: {
  to: string;
  merchantName: string;
  shopName: string;
  language?: string;
}) {
  type Copy = {
    subject: string;
    greeting: string;
    p1: string;
    p2: string;
    p3: string;
    cta: string;
    ps: string;
    signoff: string;
  };
  const name = merchantName || "there";
  const ctaUrl = utm("/dashboard/settings", "go-live-nudge");
  const link = (text: string) =>
    `<a href="${ctaUrl}" style="color:#b45309;text-decoration:underline;">${text}</a>`;
  const COPY: Record<string, Copy> = {
    en: {
      subject: `${shopName} is set up — let's get your first customer`,
      greeting: `Hi ${name},`,
      p1: `We noticed you set up <strong>${shopName}</strong>'s loyalty card and ran a couple of test stamps — nice work.`,
      p2: `There's just one step left: print your QR code from the ${link("Shop Setup menu")} and place it at your register, where your customers order their drink. Like this:`,
      p3: `That's all it takes. A customer scans it with their phone, you tap approve on the phone or tablet you keep at the counter, and they earn a stamp toward a free coffee — no app for them to download.`,
      cta: `Print your QR code`,
      ps: `Any questions? Just reply — I'm happy to help.`,
      signoff: `Cheers,<br/>Mark at Brewstamp`,
    },
    es: {
      subject: `${shopName} ya está listo — consigue tu primer cliente`,
      greeting: `Hola ${name}:`,
      p1: `Vimos que configuraste la tarjeta de fidelidad de <strong>${shopName}</strong> e hiciste un par de sellos de prueba — bien hecho.`,
      p2: `Solo queda un paso: imprime tu código QR desde el menú ${link("Configuración de la tienda")} y colócalo en tu caja, donde tus clientes piden su bebida. Así:`,
      p3: `Eso es todo. El cliente lo escanea con su móvil, tú apruebas desde el teléfono o la tablet que tienes en la caja, y gana un sello para un café gratis — sin que él descargue ninguna app.`,
      cta: `Imprime tu código QR`,
      ps: `¿Alguna pregunta? Responde sin más — con gusto te ayudo.`,
      signoff: `Un saludo,<br/>Mark de Brewstamp`,
    },
    ar: {
      subject: `تم إعداد ${shopName} — لنحصل على أول عميل لك`,
      greeting: `مرحباً ${name}،`,
      p1: `لاحظنا أنك أعددت بطاقة الولاء لـ <strong>${shopName}</strong> وأجريت بعض عمليات الختم التجريبية — أحسنت.`,
      p2: `تبقّت خطوة واحدة فقط: اطبع رمز QR من قائمة ${link("إعدادات المتجر")} وضعه عند الصندوق، حيث يطلب عملاؤك مشروبهم. هكذا:`,
      p3: `هذا كل شيء. يمسحه العميل بهاتفه، وتضغط أنت على "موافقة" من الهاتف أو الجهاز اللوحي الذي تبقيه عند الصندوق، فيحصل على ختم نحو قهوة مجانية — دون أن يُنزّل أي تطبيق.`,
      cta: `اطبع رمز QR`,
      ps: `أي أسئلة؟ ردّ ببساطة — يسعدني مساعدتك.`,
      signoff: `تحياتي،<br/>Mark من Brewstamp`,
    },
  };
  const c = COPY[language] || COPY.en;
  const rtl = language === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";

  const html = `
<!DOCTYPE html>
<html dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.subject}</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background-color:#fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background-color:#ffffff;">
    <tr>
      <td style="background-color:#1c1917; padding:32px 24px; text-align:center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display:block; margin:0 auto;" />
      </td>
    </tr>
    <tr>
      <td dir="${dir}" style="padding:32px 24px 24px; text-align:${align};">
        <p style="margin:0 0 16px; font-size:16px; color:#1c1917; line-height:1.6;">${c.greeting}</p>
        <p style="margin:0 0 16px; font-size:16px; color:#57534e; line-height:1.6;">${c.p1}</p>
        <p style="margin:0 0 16px; font-size:16px; color:#57534e; line-height:1.6;">${c.p2}</p>
        <img src="https://brewstamp.app/cafe-loyalty-counter.jpg" alt="A customer scanning a Brewstamp QR loyalty card on a cafe counter" width="552" style="display:block; width:100%; max-width:552px; height:auto; border-radius:12px; margin:0 0 20px;" />
        <p style="margin:0 0 24px; font-size:16px; color:#57534e; line-height:1.6;">${c.p3}</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr><td style="border-radius:8px; background-color:#b45309;">
            <a href="${ctaUrl}" style="display:inline-block; padding:12px 28px; font-size:16px; font-weight:600; color:#ffffff; text-decoration:none;">${c.cta}</a>
          </td></tr>
        </table>
        <p style="margin:0 0 16px; font-size:14px; color:#78716c; line-height:1.6;">${c.ps}</p>
        <p style="margin:0; font-size:16px; color:#57534e; line-height:1.6;">${c.signoff}</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#1c1917; padding:24px; text-align:center;">
        <p style="margin:0 0 4px; color:#a8a29e; font-size:13px;">Brewstamp &mdash; Digital loyalty cards for coffee shops</p>
        <p style="margin:0; color:#78716c; font-size:12px;">&copy; ${new Date().getFullYear()} Brewstamp. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM_PERSONAL,
      replyTo: REPLY_TO,
      to,
      subject: c.subject,
      html,
      headers: {
        "X-Mailin-Tag": "go-live-nudge",
        "List-Unsubscribe": LIST_UNSUBSCRIBE,
      },
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send go-live nudge email:", error);
    return { success: false, error };
  }
}
