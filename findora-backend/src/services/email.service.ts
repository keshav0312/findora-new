// Findora — transactional email via Brevo (formerly Sendinblue)
//
// Uses Brevo's plain HTTPS API (no SMTP library needed — just `fetch`,
// which is built into Node 18+). Get a free API key at https://app.brevo.com
// (Settings → SMTP & API → API Keys) and set BREVO_API_KEY in your .env.
//
// If BREVO_API_KEY is not set, every function here silently no-ops and
// logs to the console instead — so the app still runs in local/dev mode
// without an email provider configured.

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "no-reply@findora.app";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Findora";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

interface SendEmailArgs {
  to: { email: string; name?: string };
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.log(`[email:disabled] Would send "${subject}" to ${to.email}`);
    return false;
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [to],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email:error] Brevo responded ${res.status}: ${body}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email:error]", (err as Error).message);
    return false;
  }
}

function layout(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#f4f5ff;padding:32px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#4338ca;padding:24px 32px;">
        <span style="color:#ffffff;font-size:20px;font-weight:700;">📍 Findora</span>
      </div>
      <div style="padding:32px;color:#1f2937;">
        <h2 style="margin:0 0 16px;font-size:18px;">${title}</h2>
        <div style="font-size:14px;line-height:1.6;color:#374151;">${bodyHtml}</div>
        ${
          ctaLabel && ctaUrl
            ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:24px;background:#4338ca;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">${ctaLabel}</a>`
            : ""
        }
      </div>
      <div style="padding:16px 32px;background:#f9fafb;color:#9ca3af;font-size:12px;">
        Findora — Lost Something? Findora Helps You Find It.
      </div>
    </div>
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${FRONTEND_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: { email: to, name },
    subject: "Verify your Findora account",
    html: layout(
      `Welcome, ${name} 👋`,
      "Thanks for joining Findora. Please confirm your email address to activate your account and start reporting or searching for lost & found items.",
      "Verify my email",
      url
    ),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${FRONTEND_URL}/forgot-password?token=${token}`;
  return sendEmail({
    to: { email: to, name },
    subject: "Reset your Findora password",
    html: layout(
      "Reset your password",
      "We received a request to reset your Findora password. This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.",
      "Reset password",
      url
    ),
  });
}

export async function sendMatchNotificationEmail(
  to: string,
  name: string,
  itemTitle: string,
  score: number,
  aiExplanation?: string,
  distanceKm?: number | null
) {
  const url = `${FRONTEND_URL}/matches`;
  const proximityLine =
    distanceKm !== undefined && distanceKm !== null
      ? `<br/>📍 <b>${distanceKm} km</b> away from where it was lost/found — very close by!`
      : "";
  return sendEmail({
    to: { email: to, name },
    subject: `We found a possible match for "${itemTitle}" (${score}%)`,
    html: layout(
      "We found a possible match! 🎉",
      `Our AI matching engine found a <b>${score}% match</b> for <b>${itemTitle}</b>.` +
        proximityLine +
        (aiExplanation ? `<br/><br/><i>${aiExplanation}</i>` : "") +
        "<br/><br/>Open Findora to review the details and start a chat with the other party.",
      "View match",
      url
    ),
  });
}

export async function sendItemReturnedEmail(to: string, name: string, itemTitle: string) {
  return sendEmail({
    to: { email: to, name },
    subject: `"${itemTitle}" was marked as returned`,
    html: layout(
      "Case closed 🎉",
      `Great news — <b>${itemTitle}</b> has been marked as returned and closed. Thank you for using Findora to help reunite people with their belongings.`
    ),
  });
}