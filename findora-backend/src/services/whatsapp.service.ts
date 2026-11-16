// Findora — WhatsApp notifications via Meta's WhatsApp Cloud API
//
// This uses Meta's official Graph API for WhatsApp (free tier — no Twilio
// account needed). To set it up:
//   1. Go to https://developers.facebook.com -> create an app -> add the
//      "WhatsApp" product.
//   2. In WhatsApp > API Setup you get a temporary access token and a
//      "Phone number ID" for a free test number Meta provides.
//   3. Put those in .env as WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID.
//   4. While in developer/test mode you can only message phone numbers
//      you've added as "test recipients" in that same dashboard page —
//      add your own number there to try this locally. For production,
//      Meta requires business verification to message arbitrary numbers.
//
// If WHATSAPP_TOKEN isn't set, every function here logs to the console and
// returns false instead of throwing — matching the pattern used by
// email.service.ts and ai.service.ts, so the app runs fine without it.

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";

function graphUrl() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;
}

/**
 * Normalizes a phone number to the digits-only format the Cloud API expects
 * (E.164 without the leading "+"), e.g. "+91 98765-43210" -> "919876543210".
 * If the number has no country code (10 digits), assumes India (+91) since
 * that's this project's default locale — adjust DEFAULT_COUNTRY_CODE below
 * if you're deploying elsewhere.
 */
const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";

export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `${DEFAULT_COUNTRY_CODE}${digits}`;
  return digits;
}

async function sendWhatsAppMessage(toPhoneRaw: string, body: string, matchUrl: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = normalizePhone(toPhoneRaw);

  if (!token || !phoneNumberId) {
    console.log("[whatsapp:disabled] Match alert not sent; WhatsApp credentials are not configured.");
    return false;
  }
  if (!to) {
    console.log("[whatsapp:skip] Match alert not sent; the profile phone number is invalid.");
    return false;
  }

  const templateName = process.env.WHATSAPP_MATCH_TEMPLATE_NAME;
  const message = templateName
    ? {
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_MATCH_TEMPLATE_LANGUAGE || "en_US" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: matchUrl }],
            },
          ],
        },
      }
    : {
        type: "text",
        text: { body, preview_url: false },
      };

  try {
    const res = await fetch(graphUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        ...message,
      }),
    });

    if (!res.ok) {
      console.error(`[whatsapp:error] Graph API responded with status ${res.status}.`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[whatsapp:error]", (err as Error).message);
    return false;
  }
}

/**
 * The external message deliberately contains no item title or personal details.
 */
export async function sendMatchWhatsApp(
  toPhone: string,
  matchUrl: string
) {
  const body =
    `🎉 *Findora Match Alert*\n\n` +
    "A possible match was found for one of your reports.\n\n" +
    `Sign in to Findora to review it securely: ${matchUrl}`;
  return sendWhatsAppMessage(toPhone, body, matchUrl);
}