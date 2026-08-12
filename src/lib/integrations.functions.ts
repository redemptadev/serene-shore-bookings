import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IntegrationState = "connected" | "not_configured";

export interface IntegrationStatus {
  key: string;
  label: string;
  description: string;
  state: IntegrationState;
  requiredEnv: string[];
}

/** Returns configuration state only — never secret values. */
export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: boolean; integrations: IntegrationStatus[] }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { ok: false, integrations: [] };

    const has = (...keys: string[]) => keys.every((key) => Boolean(process.env[key]));
    const status = (ok: boolean): IntegrationState => (ok ? "connected" : "not_configured");

    return {
      ok: true,
      integrations: [
        {
          key: "database",
          label: "Database, Auth & Storage",
          description: "Managed backend powering properties, bookings and photos.",
          state: status(has("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY")),
          requiredEnv: ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"],
        },
        {
          key: "google_auth",
          label: "Google sign-in",
          description: "Managed Google OAuth for guest sign-in.",
          state: "connected",
          requiredEnv: [],
        },
        {
          key: "phone_otp",
          label: "Phone OTP sign-in",
          description: "International phone sign-in with one-time codes. Enable an SMS provider in Auth settings.",
          state: status(has("PHONE_OTP_ENABLED")),
          requiredEnv: ["PHONE_OTP_ENABLED"],
        },
        {
          key: "email",
          label: "Transactional email",
          description: "Booking, payment and review emails.",
          state: status(has("EMAIL_PROVIDER_API_KEY", "EMAIL_FROM")),
          requiredEnv: ["EMAIL_PROVIDER_API_KEY", "EMAIL_FROM"],
        },
        {
          key: "mpesa",
          label: "M-Pesa STK Push",
          description: "Collect payments directly to your M-Pesa shortcode.",
          state: status(
            has("MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_URL"),
          ),
          requiredEnv: [
            "MPESA_CONSUMER_KEY",
            "MPESA_CONSUMER_SECRET",
            "MPESA_SHORTCODE",
            "MPESA_PASSKEY",
            "MPESA_CALLBACK_URL",
          ],
        },
        {
          key: "card",
          label: "Card payments",
          description: "Card checkout provider.",
          state: status(has("CARD_PAYMENT_API_KEY", "CARD_PAYMENT_PUBLIC_KEY")),
          requiredEnv: ["CARD_PAYMENT_API_KEY", "CARD_PAYMENT_PUBLIC_KEY"],
        },
        {
          key: "sms",
          label: "SMS notifications",
          description: "Booking alerts by SMS.",
          state: status(has("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_SMS_NUMBER")),
          requiredEnv: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_SMS_NUMBER"],
        },
        {
          key: "whatsapp",
          label: "WhatsApp notifications",
          description: "Host alerts on WhatsApp.",
          state: status(has("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_NUMBER")),
          requiredEnv: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_NUMBER"],
        },
      ],
    };
  });
