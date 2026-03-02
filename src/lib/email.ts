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
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Customise your branding</h3>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #78716c; line-height: 1.5;">Add your logo, pick your brand colours, and set how many stamps earn a free drink. Make it yours.</p>
                    <img src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-loyalty-card.png" alt="Example branded loyalty card" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 8px; margin: 0 0 12px;" />
                    <a href="${APP_URL}/dashboard/settings" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Customise Settings &rarr;</a>
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
                    <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Open Dashboard &rarr;</a>
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

export async function sendDay3NudgeEmail({
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
  <title>Quick check-in</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding: 32px 24px 16px;">
        <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #1c1917;">Hey ${merchantName}, how&rsquo;s it going?</h1>
        <p style="margin: 0; font-size: 16px; color: #57534e; line-height: 1.6;">
          We noticed <strong>${shopName}</strong> hasn&rsquo;t had many stamps come through yet &mdash; totally normal at this stage! Most cafes just need two things to get rolling:
        </p>
      </td>
    </tr>

    <!-- Card 1: Print QR -->
    <tr>
      <td style="padding: 8px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top; padding-right: 14px;">
                    <div style="background-color: #d97706; color: #ffffff; width: 28px; height: 28px; border-radius: 14px; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">1</div>
                  </td>
                  <td>
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Print your QR code and stick it at the counter</h3>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #78716c; line-height: 1.5;">Download the PDF from your dashboard, print it out, and place it where customers can see it. Near the register or on the counter works great.</p>
                    <img src="https://cultcha.syd1.cdn.digitaloceanspaces.com/brewstamp/prod/public/email-cafe-qr.jpg" alt="QR code printed out on a cafe counter" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 8px; margin: 0 0 12px;" />
                    <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Download QR PDF &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Card 2: Device at register -->
    <tr>
      <td style="padding: 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top; padding-right: 14px;">
                    <div style="background-color: #d97706; color: #ffffff; width: 28px; height: 28px; border-radius: 14px; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">2</div>
                  </td>
                  <td>
                    <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #1c1917;">Keep a device logged in at the register</h3>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #78716c; line-height: 1.5;">When a customer scans your QR code, a stamp request pops up on your device instantly. Just tap approve. Works on any device with a browser:</p>
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
                    <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Open Dashboard &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Primary CTA -->
    <tr>
      <td style="padding: 8px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #1c1917;">Your first 10 stamps are free &mdash; don&rsquo;t let them go to waste</p>
              <p style="margin: 0 0 16px; font-size: 14px; color: #78716c; line-height: 1.5;">Print the QR code, stick it at the counter, and watch the stamps roll in.</p>
              <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Print my QR code &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- P.S. -->
    <tr>
      <td style="padding: 16px 24px 24px;">
        <p style="margin: 0; font-size: 14px; color: #78716c; line-height: 1.5; font-style: italic;">
          P.S. Most cafes get their first stamp within an hour of putting up the QR code. Just print it and place it &mdash; that&rsquo;s all it takes.
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
      to,
      subject: `Quick check-in \u2014 is your QR code up yet, ${merchantName}?`,
      html,
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
  <title>Your loyalty program is ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #1c1917; padding: 32px 24px; text-align: center;">
        <img src="https://brewstamp.app/email-logo.png" alt="Brewstamp" width="180" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding: 32px 24px 16px;">
        <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #1c1917;">Your loyalty card is ready and waiting</h1>
        <p style="margin: 0; font-size: 16px; color: #57534e; line-height: 1.6;">
          Hey ${merchantName}, it&rsquo;s been a week since you set up <strong>${shopName}</strong> on Brewstamp. Your loyalty card is good to go &mdash; customers just need to know about it!
        </p>
      </td>
    </tr>

    <!-- Social proof box -->
    <tr>
      <td style="padding: 8px 24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0; font-size: 14px; color: #78716c; line-height: 1.6;">
                <strong style="color: #1c1917;">The cafes that see the best results</strong> all start the same way: printing the QR code and mentioning it to customers at checkout. Once the first few scan, word spreads quickly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Tips heading -->
    <tr>
      <td style="padding: 8px 24px 4px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #1c1917;">Three ways to get your first stamps</h2>
      </td>
    </tr>

    <!-- Tip 1 -->
    <tr>
      <td style="padding: 12px 24px 4px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; padding-right: 12px;">
              <div style="background-color: #d97706; color: #ffffff; width: 24px; height: 24px; border-radius: 12px; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700;">1</div>
            </td>
            <td>
              <p style="margin: 0; font-size: 14px; color: #44403c; line-height: 1.5;">
                <strong>Mention it at checkout.</strong> A quick &ldquo;We&rsquo;ve got a digital loyalty card &mdash; just scan the QR code!&rdquo; goes a long way.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Tip 2 -->
    <tr>
      <td style="padding: 12px 24px 4px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; padding-right: 12px;">
              <div style="background-color: #d97706; color: #ffffff; width: 24px; height: 24px; border-radius: 12px; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700;">2</div>
            </td>
            <td>
              <p style="margin: 0; font-size: 14px; color: #44403c; line-height: 1.5;">
                <strong>Put the QR code where customers wait.</strong> Near the register, on the counter, or next to the menu board &mdash; anywhere eyes land while they wait.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Tip 3 -->
    <tr>
      <td style="padding: 12px 24px 16px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; padding-right: 12px;">
              <div style="background-color: #d97706; color: #ffffff; width: 24px; height: 24px; border-radius: 12px; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700;">3</div>
            </td>
            <td>
              <p style="margin: 0; font-size: 14px; color: #44403c; line-height: 1.5;">
                <strong>Reward your first customer.</strong> Give them a bonus stamp to get things started &mdash; it creates a great first impression and gets the ball rolling.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Primary CTA -->
    <tr>
      <td style="padding: 8px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #1c1917;">Your regulars are waiting &mdash; let&rsquo;s get them stamping</p>
              <p style="margin: 0 0 16px; font-size: 14px; color: #78716c; line-height: 1.5;">Download your QR code, print it out, and place it at the counter. That&rsquo;s it.</p>
              <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Download my QR code &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- P.S. -->
    <tr>
      <td style="padding: 16px 24px 24px;">
        <p style="margin: 0; font-size: 14px; color: #78716c; line-height: 1.5; font-style: italic;">
          P.S. Reply to this email if you want a hand getting set up &mdash; happy to walk you through it personally.
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
      to,
      subject: `Your loyalty program is ready \u2014 here\u2019s how to make it count`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Failed to send day 7 follow-up email:", error);
    return { success: false, error };
  }
}
