const { EmailClient } = require("@azure/communication-email");

// Use connection string from environment variables
const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
// Use a friendly name format if supported, otherwise just the email
const rawSenderAddress = process.env.SENDER_EMAIL_ADDRESS || "DoNotReply@caresync.com";
// Azure syntax for display name: "DisplayName <email>" works in recent SDKs or sometimes requires specific field
const senderAddress = rawSenderAddress;

const emailClient = connectionString ? new EmailClient(connectionString) : null;

exports.sendWelcomeEmail = async (toEmail, role) => {
    if (!emailClient) {
        console.warn("Azure Communication Services not configured. Skipping email send.");
        return;
    }

    const subject = `Welcome to CareSync, your new ${role} portal`;
    const plainText = `Welcome to CareSync!\n\nYou have been invited to join our platform as a ${role}.\n\nPlease download our mobile app to get started and access your dashboard.\n\nBest regards,\nThe CareSync Team`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background-color: #4A90E2; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: #fff; margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .cta-button { display: inline-block; background-color: #4A90E2; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .footer { font-size: 12px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to CareSync</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have been formally invited to join <strong>CareSync</strong> as a <strong style="color: #4A90E2; text-transform: capitalize;">${role}</strong>.</p>
                <p>CareSync helps you manage medication schedules, coordinate care, and stay connected with your patients.</p>
                <p>Please download our mobile application to accept this invitation and get started.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://play.google.com/store" class="cta-button">Download App</a>
                </div>
                
                <p>If you have any questions, please contact your administrator.</p>
                <p>Best regards,<br>The CareSync Team</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} CareSync. All rights reserved.</p>
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const message = {
        senderAddress: senderAddress,
        content: {
            subject: subject,
            plainText: plainText,
            html: html,
        },
        recipients: {
            to: [{ address: toEmail }],
        },
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

    const subject = "CareSync - Password Reset Code";
    const plainText = `Your password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe CareSync Team`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background-color: #4A90E2; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: #fff; margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; text-align: center; }
            .otp-code { font-size: 36px; font-weight: bold; color: #4A90E2; letter-spacing: 8px; padding: 20px; background: #F5F7FA; border-radius: 10px; margin: 20px 0; }
            .footer { font-size: 12px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
            .warning { color: #EB5757; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You requested to reset your password. Use the code below to complete the process:</p>
                
                <div class="otp-code">${otp}</div>
                
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                
                <p class="warning">If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} CareSync. All rights reserved.</p>
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const message = {
        senderAddress: senderAddress,
        content: {
            subject: subject,
            plainText: plainText,
            html: html,
        },
        recipients: {
            to: [{ address: toEmail }],
        },
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
        content: {
            subject: subject,
            html: htmlContent,
        },
        recipients: {
            to: [{ address: toEmail }],
        },
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
