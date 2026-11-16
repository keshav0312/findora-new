import { normalizePhone } from "./whatsapp.service.js";

export async function sendMatchSms(toPhone: string, matchUrl: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    console.log("[sms:disabled] Match alert not sent; Twilio credentials are not configured.");
    return false;
  }

  const normalizedPhone = normalizePhone(toPhone);
  if (!normalizedPhone) {
    console.log("[sms:skip] Match alert not sent; the profile phone number is invalid.");
    return false;
  }

  const form = new URLSearchParams({
    To: `+${normalizedPhone}`,
    Body: `Findora: A possible match was found for one of your reports. Sign in to review it securely: ${matchUrl}`,
  });
  if (messagingServiceSid) {
    form.set("MessagingServiceSid", messagingServiceSid);
  } else {
    form.set("From", fromNumber!);
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      }
    );

    if (!response.ok) {
      console.error(`[sms:error] Twilio responded with status ${response.status}.`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[sms:error]", (err as Error).message);
    return false;
  }
}
