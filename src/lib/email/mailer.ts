import nodemailer, { type Transporter } from "nodemailer";
import { getEnv, isMailConfigured } from "@/lib/env";

let transporter: Transporter | null = null;
let warnedUnconfigured = false;

function getTransport(): Transporter | null {
  if (!isMailConfigured()) {
    if (!warnedUnconfigured) {
      console.warn(
        "[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not set — emails are no-ops.",
      );
      warnedUnconfigured = true;
    }
    return null;
  }
  if (!transporter) {
    const env = getEnv();
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export interface MailMessage {
  to?: string;
  bcc?: string[];
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends one email. Returns true if sent, false if mail is unconfigured.
 * Throws only on a genuine transport error — callers in notify.ts swallow it;
 * transactional callers may surface a "resend" path.
 */
export async function sendMail(msg: MailMessage): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;
  const env = getEnv();
  await transport.sendMail({
    from: env.GMAIL_USER, // Gmail rewrites From to the authenticated account anyway
    to: msg.to ?? env.GMAIL_USER,
    bcc: msg.bcc,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  });
  return true;
}
