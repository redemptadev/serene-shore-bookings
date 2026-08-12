/**
 * Safaricom Daraja (M-Pesa) STK Push.
 * All credentials are read from server-side environment variables only.
 */
const BASE = () =>
  (process.env["MPESA_ENV"] ?? "sandbox") === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export function mpesaConfigured() {
  return Boolean(
    process.env["MPESA_CONSUMER_KEY"] &&
      process.env["MPESA_CONSUMER_SECRET"] &&
      process.env["MPESA_SHORTCODE"] &&
      process.env["MPESA_PASSKEY"] &&
      process.env["MPESA_CALLBACK_URL"],
  );
}

async function accessToken() {
  const key = process.env["MPESA_CONSUMER_KEY"]!;
  const secret = process.env["MPESA_CONSUMER_SECRET"]!;
  const response = await fetch(`${BASE()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${btoa(`${key}:${secret}`)}` },
  });
  if (!response.ok) throw new Error(`mpesa_auth_failed_${response.status}`);
  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(
    now.getUTCMinutes(),
  )}${pad(now.getUTCSeconds())}`;
}

export async function stkPush(input: { phone: string; amount: number; reference: string; description: string }) {
  const shortcode = process.env["MPESA_SHORTCODE"]!;
  const passkey = process.env["MPESA_PASSKEY"]!;
  const callback = process.env["MPESA_CALLBACK_URL"]!;
  const ts = timestamp();
  const token = await accessToken();
  const phone = input.phone.replace(/\D/g, "").replace(/^0/, "254");

  const response = await fetch(`${BASE()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: btoa(`${shortcode}${passkey}${ts}`),
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(input.amount)),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callback,
      AccountReference: input.reference.slice(0, 12),
      TransactionDesc: input.description.slice(0, 60),
    }),
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok || payload["ResponseCode"] !== "0") {
    throw new Error(String(payload["errorMessage"] ?? `mpesa_push_failed_${response.status}`));
  }
  return {
    checkoutRequestId: String(payload["CheckoutRequestID"]),
    merchantRequestId: String(payload["MerchantRequestID"]),
    customerMessage: String(payload["CustomerMessage"] ?? "Enter your M-Pesa PIN to complete payment."),
  };
}

export async function stkQuery(checkoutRequestId: string) {
  const shortcode = process.env["MPESA_SHORTCODE"]!;
  const passkey = process.env["MPESA_PASSKEY"]!;
  const ts = timestamp();
  const token = await accessToken();
  const response = await fetch(`${BASE()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: btoa(`${shortcode}${passkey}${ts}`),
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  });
  const payload = (await response.json()) as Record<string, unknown>;
  return { resultCode: String(payload["ResultCode"] ?? ""), raw: payload };
}
