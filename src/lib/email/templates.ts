import { getEnv } from "@/lib/env";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function appUrl(): string {
  return getEnv().APP_URL.replace(/\/$/, "");
}

function layout(heading: string, bodyHtml: string, cta?: { label: string; url: string }) {
  const button = cta
    ? `<a href="${cta.url}" style="display:inline-block;background:#3949ab;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;margin:18px 0;">${cta.label}</a>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f5f7f9;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#1a237e,#5c6bc0);border-radius:14px 14px 0 0;padding:22px 28px;">
      <span style="color:#fff;font-weight:800;letter-spacing:1px;font-size:14px;">♪ ABERJONA TRI-M HOURS</span>
    </div>
    <div style="background:#fff;border-radius:0 0 14px 14px;padding:28px;">
      <h1 style="font-size:19px;color:#1a237e;margin:0 0 12px;">${heading}</h1>
      <div style="font-size:14px;color:#374151;line-height:1.6;">${bodyHtml}</div>
      ${button}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">Aberjona Chapter — Tri-M Music Honor Society</p>
  </div></body></html>`;
}

export function verificationEmail(name: string, token: string): EmailContent {
  const url = `${appUrl()}/verify-email?token=${token}`;
  return {
    subject: "Verify your Aberjona Tri-M account",
    html: layout(
      `Welcome, ${name}!`,
      `<p>Confirm your email address to activate your chapter account. This link expires in 48 hours.</p>`,
      { label: "Verify Email", url },
    ),
    text: `Welcome, ${name}!\n\nVerify your email to activate your account (expires in 48 hours):\n${url}`,
  };
}

export function passwordResetEmail(name: string, token: string): EmailContent {
  const url = `${appUrl()}/reset-password?token=${token}`;
  return {
    subject: "Reset your Aberjona Tri-M password",
    html: layout(
      `Password reset`,
      `<p>Hi ${name}, we received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
      { label: "Reset Password", url },
    ),
    text: `Hi ${name},\n\nReset your password (expires in 1 hour):\n${url}\n\nIf you didn't request this, ignore this email.`,
  };
}

export function inviteEmail(link: string, expiresAt: Date): EmailContent {
  return {
    subject: "You're invited to join the Aberjona Tri-M Hours Log",
    html: layout(
      `You've been invited`,
      `<p>An officer has invited you to join the chapter's hours log. Use the link below to create your account. The invite expires on ${expiresAt.toLocaleDateString()}.</p>`,
      { label: "Create Your Account", url: link },
    ),
    text: `You've been invited to join the Aberjona Tri-M Hours Log.\n\nCreate your account (expires ${expiresAt.toLocaleDateString()}):\n${link}`,
  };
}

export function eventPostedEmail(eventTitle: string, dateLabel: string, hours: number): EmailContent {
  const url = `${appUrl()}/member/events`;
  return {
    subject: `New volunteer event: ${eventTitle}`,
    html: layout(
      `New event posted`,
      `<p><strong>${eventTitle}</strong> is now open for sign-ups.</p><p>Date: ${dateLabel}<br>Hours: ${hours}</p>`,
      { label: "View &amp; Sign Up", url },
    ),
    text: `New event posted: ${eventTitle}\nDate: ${dateLabel}\nHours: ${hours}\n\nSign up: ${url}`,
  };
}

export function requestDecisionEmail(
  eventTitle: string,
  approved: boolean,
): EmailContent {
  const url = `${appUrl()}/member/dashboard`;
  return approved
    ? {
        subject: `Your event request was approved: ${eventTitle}`,
        html: layout(
          `Request approved`,
          `<p>Your requested event <strong>${eventTitle}</strong> has been approved and is now active for sign-ups.</p>`,
          { label: "View Dashboard", url },
        ),
        text: `Your event request "${eventTitle}" was approved and is now active.\n${url}`,
      }
    : {
        subject: `Update on your event request: ${eventTitle}`,
        html: layout(
          `Request not approved`,
          `<p>Your requested event <strong>${eventTitle}</strong> was not approved. Reach out to an officer if you have questions.</p>`,
          { label: "View Dashboard", url },
        ),
        text: `Your event request "${eventTitle}" was not approved.\n${url}`,
      };
}

export function hoursCreditedEmail(
  name: string,
  hours: number,
  eventTitle: string,
): EmailContent {
  const url = `${appUrl()}/member/dashboard`;
  return {
    subject: `${hours} service hours credited`,
    html: layout(
      `Hours credited`,
      `<p>Hi ${name}, you've been credited <strong>${hours} hour${hours === 1 ? "" : "s"}</strong> for attending <strong>${eventTitle}</strong>.</p>`,
      { label: "View Your Progress", url },
    ),
    text: `Hi ${name}, you've been credited ${hours} hour(s) for attending ${eventTitle}.\n${url}`,
  };
}

export function newRequestEmail(eventTitle: string, requesterName: string): EmailContent {
  const url = `${appUrl()}/officer/requests`;
  return {
    subject: `New event request: ${eventTitle}`,
    html: layout(
      `New event request`,
      `<p><strong>${requesterName}</strong> submitted a new event request: <strong>${eventTitle}</strong>. Review it to approve or deny.</p>`,
      { label: "Review Requests", url },
    ),
    text: `${requesterName} requested a new event: ${eventTitle}\nReview: ${url}`,
  };
}
