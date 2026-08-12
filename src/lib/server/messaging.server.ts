/** SMS / WhatsApp transport. Nothing is faked: unconfigured providers report back honestly. */
export type MessageResult = { sent: boolean; reason?: string };

export function smsConfigured() {
  return Boolean(process.env["TWILIO_ACCOUNT_SID"] && process.env["TWILIO_AUTH_TOKEN"] && process.env["TWILIO_SMS_NUMBER"]);
}

export function whatsappConfigured() {
  return Boolean(
    process.env["TWILIO_ACCOUNT_SID"] && process.env["TWILIO_AUTH_TOKEN"] && process.env["TWILIO_WHATSAPP_NUMBER"],
  );
}

async function twilioSend(from: string, to: string, body: string): Promise<MessageResult> {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (!sid || !token) return { sent: false, reason: "provider_not_configured" };
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    });
    if (!response.ok) {
      console.error("twilio error", response.status, (await response.text()).slice(0, 300));
      return { sent: false, reason: `provider_error_${response.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error("twilio transport failure", error);
    return { sent: false, reason: "transport_error" };
  }
}

export async function sendSms(to: string, body: string): Promise<MessageResult> {
  if (!smsConfigured()) return { sent: false, reason: "sms_not_configured" };
  return twilioSend(process.env["TWILIO_SMS_NUMBER"]!, to, body);
}

export async function sendWhatsApp(to: string, body: string): Promise<MessageResult> {
  if (!whatsappConfigured()) return { sent: false, reason: "whatsapp_not_configured" };
  const number = process.env["TWILIO_WHATSAPP_NUMBER"]!;
  const from = number.startsWith("whatsapp:") ? number : `whatsapp:${number}`;
  return twilioSend(from, to.startsWith("whatsapp:") ? to : `whatsapp:${to}`, body);
}
