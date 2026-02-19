import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!email || !message) {
      return NextResponse.json(
        { message: "Email and message are required" },
        { status: 400 }
      );
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background-color: #d97706; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          New Contact Form Submission
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e7e5e4;">
              <strong style="color: #1c1917;">Name:</strong>
              <span style="color: #78716c; margin-left: 8px;">${name || "Not provided"}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e7e5e4;">
              <strong style="color: #1c1917;">Email:</strong>
              <a href="mailto:${email}" style="color: #d97706; margin-left: 8px;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0 0 0;">
              <strong style="color: #1c1917;">Message:</strong>
              <p style="color: #1c1917; margin: 8px 0 0 0; padding: 12px; background-color: #fafaf9; border-radius: 4px; white-space: pre-wrap;">${message}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background-color: #fafaf9; border-top: 1px solid #e7e5e4; text-align: center;">
        <p style="margin: 0; color: #a8a29e; font-size: 14px;">
          This message was sent from the Brewstamp contact form.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"Brewstamp Contact" <${process.env.EMAIL_FROM || "noreply@brewstamp.app"}>`,
      to: "hello@brewstamp.app",
      replyTo: email,
      subject: `Contact Form: ${name || "Anonymous"} - ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`,
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("[Contact] Error sending email:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }
}
