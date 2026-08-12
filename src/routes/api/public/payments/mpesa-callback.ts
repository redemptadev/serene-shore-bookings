import { createFileRoute } from "@tanstack/react-router";

/**
 * M-Pesa (Daraja) STK callback. Payment is only trusted here, never in the browser.
 * Configure this URL as MPESA_CALLBACK_URL.
 */
export const Route = createFileRoute("/api/public/payments/mpesa-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { adminDb } = await import("@/lib/server/db.server");
        const { markBookingPaid, announceBookingEvent } = await import("@/lib/server/booking-service.server");

        let payload: Record<string, unknown> = {};
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "invalid payload" }), { status: 400 });
        }

        const callback = (payload["Body"] as Record<string, unknown> | undefined)?.["stkCallback"] as
          | Record<string, unknown>
          | undefined;
        const checkoutRequestId = callback?.["CheckoutRequestID"] as string | undefined;
        const resultCode = String(callback?.["ResultCode"] ?? "");

        if (!checkoutRequestId) {
          return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "ignored" }), { status: 200 });
        }

        const db = await adminDb();
        const { data: payment } = await db
          .from("payments")
          .select("*")
          .eq("checkout_request_id", checkoutRequestId)
          .maybeSingle();

        if (!payment) {
          return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "unknown payment" }), { status: 200 });
        }

        const items = ((callback?.["CallbackMetadata"] as Record<string, unknown> | undefined)?.["Item"] ??
          []) as { Name?: string; Value?: unknown }[];
        const receipt = items.find((item) => item.Name === "MpesaReceiptNumber")?.Value;

        if (resultCode === "0") {
          await db
            .from("payments")
            .update({ status: "paid", provider_reference: receipt ? String(receipt) : null, raw_payload: payload })
            .eq("id", payment.id);
          await markBookingPaid(payment.booking_id, receipt ? String(receipt) : null);
        } else {
          await db.from("payments").update({ status: "failed", raw_payload: payload }).eq("id", payment.id);
          await db.from("bookings").update({ payment_status: "failed" }).eq("id", payment.booking_id);
          await announceBookingEvent("payment_failed", payment.booking_id);
        }

        return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "accepted" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
