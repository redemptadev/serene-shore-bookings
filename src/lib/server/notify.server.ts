import { sendEmail } from "./email.server";
import { sendWhatsApp } from "./messaging.server";
import { hostAlertEmail } from "./email-templates.server";

export interface NotifyChannels {
  inApp: boolean;
  email: { sent: boolean; reason?: string };
  whatsapp: { sent: boolean; reason?: string };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function pushNotification(input: {
  userId?: string | null;
  audience?: "user" | "admin";
  title: string;
  body?: string;
  kind?: string;
  bookingId?: string | null;
}) {
  const client = await admin();
  const { error } = await client.from("notifications").insert({
    user_id: input.userId ?? null,
    audience: input.audience ?? "user",
    title: input.title,
    body: input.body ?? "",
    kind: input.kind ?? "info",
    booking_id: input.bookingId ?? null,
  });
  if (error) console.error("notification insert failed", error.message);
}

export async function notifyGuest(input: {
  userId?: string | null;
  email?: string | null;
  title: string;
  body?: string;
  kind?: string;
  bookingId?: string | null;
  mail?: { subject: string; html: string };
  replyTo?: string;
}): Promise<NotifyChannels> {
  await pushNotification({
    userId: input.userId ?? null,
    audience: "user",
    title: input.title,
    body: input.body ?? "",
    kind: input.kind ?? "info",
    bookingId: input.bookingId ?? null,
  });
  const email = input.mail && input.email
    ? await sendEmail({
        to: input.email,
        subject: input.mail.subject,
        html: input.mail.html,
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      })
    : { sent: false, reason: "no_email_payload" };
  return { inApp: true, email, whatsapp: { sent: false, reason: "not_targeted" } };
}

export async function notifyHost(input: {
  title: string;
  body?: string;
  kind?: string;
  bookingId?: string | null;
  rows?: [string, string][];
  hostEmail?: string | null;
  whatsappNumber?: string | null;
}): Promise<NotifyChannels> {
  await pushNotification({
    audience: "admin",
    title: input.title,
    body: input.body ?? "",
    kind: input.kind ?? "info",
    bookingId: input.bookingId ?? null,
  });

  const mail = hostAlertEmail(input.title, input.body ?? "", input.rows ?? []);
  const email = input.hostEmail
    ? await sendEmail({ to: input.hostEmail, subject: mail.subject, html: mail.html })
    : { sent: false, reason: "no_host_email" };
  const whatsapp = input.whatsappNumber
    ? await sendWhatsApp(input.whatsappNumber, `${input.title}\n${input.body ?? ""}`)
    : { sent: false, reason: "no_whatsapp_number" };

  return { inApp: true, email, whatsapp };
}
