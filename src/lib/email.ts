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

const FROM = `"Brewstamp" <${process.env.EMAIL_FROM || "hello@brewstamp.app"}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://brewstamp.app";

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
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Print your QR code</h3>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #78716c; line-height: 1.5;">Download your unique QR code from the dashboard and print it out. Stick it at the counter, on the menu board, or wherever customers will see it.</p>
                    <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Download QR Code &rarr;</a>
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
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Display it for customers</h3>
                    <p style="margin: 0; font-size: 14px; color: #78716c; line-height: 1.5;">When a customer wants a stamp, they scan the QR code with their phone camera. No app download needed &mdash; it opens right in their browser.</p>
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
                    <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Open Dashboard &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 4 -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top; padding-right: 14px;">
                    <div style="background-color: #d97706; color: #ffffff; width: 28px; height: 28px; border-radius: 14px; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">4</div>
                  </td>
                  <td>
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Customise your branding</h3>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #78716c; line-height: 1.5;">Add your logo, pick your brand colours, and set how many stamps earn a free drink. Make it yours.</p>
                    <a href="${APP_URL}/dashboard/settings" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Customise Settings &rarr;</a>
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
        <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Go to your Dashboard</a>
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
      subject: `Welcome to Brewstamp, ${merchantName}!`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error);
    return { success: false, error };
  }
}
