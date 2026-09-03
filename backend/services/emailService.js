const nodemailer = require('nodemailer');

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // 1. If SMTP env vars are explicitly provided (e.g. production/staging)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  // 2. Local development: create an Ethereal test account or fallback to console
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  } catch (err) {
    console.warn('Could not connect to Ethereal Email test service, falling back to console logger:', err.message);
    return null;
  }
}

/**
 * Sends a password reset email.
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.resetUrl - Full password reset URL
 * @returns {Promise<{ success: boolean, previewUrl?: string }>}
 */
async function sendPasswordResetEmail({ to, resetUrl }) {
  // During tests, bypass actual mail sending
  if (process.env.NODE_ENV === 'test') {
    return { success: true, previewUrl: null };
  }

  const fromAddress = process.env.EMAIL_FROM || '"Gistly" <no-reply@gistly.app>';
  const subject = 'Reset your Gistly password';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
      </head>
      <body style="margin: 0; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F8F6; color: #1B1B18;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #EBE7DF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1B1B18; letter-spacing: -0.5px;">Gistly</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1B1B18;">Reset your password</h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #5A5955;">
                We received a request to reset the password for your Gistly account. Click the button below to choose a new password:
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #1B1B18; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.2px;">
                  Reset Password
                </a>
              </div>
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #8C8A82;">
                This link will expire in <strong>15 minutes</strong>. If you did not request this password reset, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #EBE7DF; margin: 24px 0;" />
              <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #8C8A82; word-break: break-all;">
                Having trouble clicking the button? Copy and paste this URL into your browser:<br/>
                <a href="${resetUrl}" style="color: #2F6FED; text-decoration: underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const textContent = `
Reset your Gistly password

We received a request to reset the password for your Gistly account.
Follow this link to choose a new password:

${resetUrl}

This link is valid for 15 minutes.
If you did not request this change, please ignore this email.
  `.trim();

  const transporter = await getTransporter();

  if (!transporter) {
    // Console fallback if no transport is available
    console.log('\n================== [GISTLY DEV EMAIL] ==================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('========================================================\n');
    return { success: true, previewUrl: resetUrl };
  }

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text: textContent,
    html: htmlContent,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log('\n================== [GISTLY DEV EMAIL SENT] ==================');
  console.log(`To: ${to}`);
  if (previewUrl) {
    console.log(`📧 Ethereal Preview URL: ${previewUrl}`);
  }
  console.log(`🔗 Direct Reset Link: ${resetUrl}`);
  console.log('=============================================================\n');

  return { success: true, previewUrl: previewUrl || resetUrl };
}

module.exports = { sendPasswordResetEmail };
