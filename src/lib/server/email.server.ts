/**
 * Transactional email transport.
 * Provider credentials live only in server environment variables.
 * When nothing is configured the send is skipped and reported honestly —
 * the app never claims an email was delivered.
 */
export type EmailResult = { sent: boolean; reason?: string; id?: string };

export function emailConfigured() {
  return Boolean(process.env["EMAIL_PROVIDER_API_KEY"] && process.env["EMAIL_FROM"]);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const apiKey = process.env["EMAIL_PROVIDER_API_KEY"];
  const from = process.env["EMAIL_FROM"];
  if (!apiKey || !from) return { sent: false, reason: "email_not_configured" };
  if (!input.to) return { sent: false, reason: "missing_recipient" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        reply_to: input.replyTo,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("email provider error", response.status, text.slice(0, 400));
      return { sent: false, reason: `provider_error_${response.status}` };
    }
    const payload = (await response.json()) as { id?: string };
    return payload.id ? { sent: true, id: payload.id } : { sent: true };
  } catch (error) {
    console.error("email transport failure", error);
    return { sent: false, reason: "transport_error" };
  }
}
