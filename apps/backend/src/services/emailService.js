const { EmailClient } = require("@azure/communication-email");

// Use connection string from environment variables
const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
// Use a friendly name format if supported, otherwise just the email
const rawSenderAddress = process.env.SENDER_EMAIL_ADDRESS || "DoNotReply@casyomax.com";
// Azure syntax for display name: "DisplayName <email>" works in recent SDKs or sometimes requires specific field
const senderAddress = rawSenderAddress;

const emailClient = connectionString ? new EmailClient(connectionString) : null;

// --- Brand tokens (mirrors the mobile design system) ---------------------------
const BRAND = {
    name: "Casyomax",
    primary: "#4F46E5",
    violet: "#8B5CF6",
    text: "#0F172A",
    text2: "#475569",
    muted: "#94A3B8",
    bg: "#F5F6FC",
    surface: "#FFFFFF",
    border: "#E2E8F0",
    sunken: "#F1F5F9",
    danger: "#EF4444",
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Store listings for the Casyomax app.
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.casyomax.app";
const APP_STORE_URL = "https://apps.apple.com/app/id6758986276";

const roleLabel = (role) => {
    if (!role) return "member";
    if (role === "caregiver") return "Caretaker";
    return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Wraps body content in the branded, modern, email-client-safe shell
 * (table layout + inline styles for Outlook/Gmail compatibility).
 * To use a hosted logo image instead of the lettermark, replace the
 * `.brand-badge` block with: <img src="https://your-domain/logo.png" width="56" alt="Casyomax" />
 */
const renderEmail = ({ heading, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
</head>
<body style="margin:0; padding:0; background-color:${BRAND.bg}; font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${BRAND.surface}; border:1px solid ${BRAND.border}; border-radius:18px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${BRAND.primary}; background-image:linear-gradient(135deg, ${BRAND.primary}, ${BRAND.violet}); padding:36px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width:60px; height:60px; line-height:60px; background-color:#FFFFFF; border-radius:16px; text-align:center; margin:0 auto 14px;">
                      <span style="font-size:30px; font-weight:800; color:${BRAND.primary}; font-family:${FONT};">C</span>
                    </div>
                    <div style="font-size:24px; font-weight:800; color:#FFFFFF; letter-spacing:-0.3px;">${heading}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 28px; color:${BRAND.text}; font-size:15px; line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px 28px; border-top:1px solid ${BRAND.border};">
              <p style="margin:0; font-size:12px; color:${BRAND.muted}; text-align:center; line-height:1.6;">
                &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.<br/>
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Two store buttons (Google Play filled, App Store outlined), stacked + centered.
const storeButtons = () => `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 22px;">
    <tr>
      <td align="center" bgcolor="${BRAND.primary}" style="border-radius:12px;">
        <a href="${PLAY_URL}" target="_blank"
           style="display:inline-block; padding:14px 30px; font-family:${FONT}; font-size:15px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:12px;">
          Get it on Google Play
        </a>
      </td>
    </tr>
    <tr><td style="height:12px; line-height:12px; font-size:0;">&nbsp;</td></tr>
    <tr>
      <td align="center" style="border:1.5px solid ${BRAND.primary}; border-radius:12px;">
        <a href="${APP_STORE_URL}" target="_blank"
           style="display:inline-block; padding:12px 30px; font-family:${FONT}; font-size:15px; font-weight:700; color:${BRAND.primary}; text-decoration:none; border-radius:12px;">
          Download on the App Store
        </a>
      </td>
    </tr>
  </table>
`;

exports.sendWelcomeEmail = async (toEmail, role) => {
    if (!emailClient) {
        console.warn("Azure Communication Services not configured. Skipping email send.");
        return;
    }

    const label = roleLabel(role);
    const subject = `You're invited to ${BRAND.name}`;
    const plainText = `Welcome to ${BRAND.name}!\n\nYou have been invited to join as a ${label}.\n\n${BRAND.name} helps you manage medication schedules, coordinate care, and stay connected.\n\nDownload the app to accept this invitation and get started:\nGoogle Play: ${PLAY_URL}\nApp Store: ${APP_STORE_URL}\n\nBest regards,\nThe ${BRAND.name} Team`;

    const body = `
        <p style="margin:0 0 16px;">Hello,</p>
        <p style="margin:0 0 16px;">You have been invited to join <strong>${BRAND.name}</strong> as a
          <strong style="color:${BRAND.primary};">${label}</strong>.</p>
        <p style="margin:0 0 16px; color:${BRAND.text2};">${BRAND.name} helps you manage medication schedules, coordinate care, and stay connected with the people you care for.</p>
        <p style="margin:0 0 8px; color:${BRAND.text2};">Download the mobile app to accept your invitation and get started.</p>
        ${storeButtons()}
        <p style="margin:0 0 6px; color:${BRAND.text2}; font-size:14px;">If you have any questions, please contact your administrator.</p>
        <p style="margin:16px 0 0;">Best regards,<br/><strong>The ${BRAND.name} Team</strong></p>
    `;

    const html = renderEmail({ heading: `Welcome to ${BRAND.name}`, bodyHtml: body });

    const message = {
        senderAddress: senderAddress,
        content: { subject, plainText, html },
        recipients: { to: [{ address: toEmail }] },
    };

    try {
        const poller = await emailClient.beginSend(message);
        const result = await poller.pollUntilDone();
        console.log("Welcome email sent successfully:", result);
        return result;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

// Send Password Reset OTP Email
exports.sendPasswordResetEmail = async (toEmail, otp) => {
    if (!emailClient) {
        console.warn("Azure Communication Services not configured. Skipping email send.");
        console.log(`[DEV MODE] Password Reset OTP for ${toEmail}: ${otp}`);
        return;
    }

    const subject = `${BRAND.name} — Password Reset Code`;
    const plainText = `Your ${BRAND.name} password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe ${BRAND.name} Team`;

    const body = `
        <p style="margin:0 0 16px;">Hello,</p>
        <p style="margin:0 0 8px; color:${BRAND.text2};">You requested to reset your password. Use the code below to complete the process:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto;">
          <tr>
            <td align="center" style="background-color:${BRAND.sunken}; border:1px solid ${BRAND.border}; border-radius:14px; padding:20px 28px;">
              <span style="font-size:34px; font-weight:800; letter-spacing:10px; color:${BRAND.primary}; font-family:${FONT};">${otp}</span>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px; color:${BRAND.text2}; text-align:center;">This code will expire in <strong>10 minutes</strong>.</p>
        <p style="margin:0; color:${BRAND.danger}; font-size:13px; text-align:center;">If you did not request this password reset, please ignore this email or contact support.</p>
    `;

    const html = renderEmail({ heading: "Password Reset", bodyHtml: body });

    const message = {
        senderAddress: senderAddress,
        content: { subject, plainText, html },
        recipients: { to: [{ address: toEmail }] },
    };

    try {
        const poller = await emailClient.beginSend(message);
        const result = await poller.pollUntilDone();
        console.log("Password reset email sent successfully:", result);
        return result;
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

exports.sendCustomEmail = async (toEmail, subject, htmlContent) => {
    if (!emailClient) {
        console.warn("Azure Communication Services not configured. Skipping email send.");
        return;
    }

    const message = {
        senderAddress: senderAddress,
        content: { subject, html: htmlContent },
        recipients: { to: [{ address: toEmail }] },
    };

    try {
        const poller = await emailClient.beginSend(message);
        const result = await poller.pollUntilDone();
        console.log(`Custom email sent to ${toEmail}: ${result.status}`);
        return result;
    } catch (error) {
        console.error("Error sending custom email:", error);
        throw error;
    }
};
