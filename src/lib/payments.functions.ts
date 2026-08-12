import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const initiateSchema = z.object({
  bookingId: z.string().uuid(),
  provider: z.enum(["mpesa", "card"]).default("mpesa"),
  phone: z.string().trim().min(7).max(20).optional(),
});

export const initiatePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => initiateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { getProvider } = await import("./server/payments.server");
    const { adminDb } = await import("./server/db.server");

    const { data: booking } = await context.supabase
      .from("bookings")
      .select("*, properties(name)")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (!booking) return { ok: false as const, message: "Booking not found." };
    if (booking.payment_status === "paid") return { ok: false as const, message: "This booking is already paid." };
    if (booking.booking_status === "cancelled") {
      return { ok: false as const, message: "This booking was cancelled and can no longer be paid." };
    }

    const provider = getProvider(data.provider);
    if (!provider.isConfigured()) {
      return {
        ok: false as const,
        message: `${provider.label} is not configured yet. Your host must add credentials before online payment works.`,
        needsConfiguration: true,
      };
    }

    const db = await adminDb();
    try {
      const result = await provider.initiate({
        bookingId: booking.id,
        reference: booking.reference,
        amount: Number(booking.total),
        currency: booking.currency,
        phone: data.phone ?? booking.guest_phone,
        email: booking.guest_email,
        description: `Coastal Haven ${booking.reference}`,
      });

      await db.from("payments").insert({
        booking_id: booking.id,
        provider: provider.id,
        amount: Number(booking.total),
        currency: booking.currency,
        status: "pending",
        checkout_request_id: result.checkoutRequestId ?? null,
      });

      return { ok: true as const, ...result };
    } catch (error) {
      await db.from("payments").insert({
        booking_id: booking.id,
        provider: provider.id,
        amount: Number(booking.total),
        currency: booking.currency,
        status: "failed",
        raw_payload: JSON.parse(JSON.stringify({ error: error instanceof Error ? error.message : "unknown" })),
      });
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Payment could not be started. Please try again.",
      };
    }
  });

export const refreshPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { stkQuery, mpesaConfigured } = await import("./server/mpesa.server");
    const { markBookingPaid } = await import("./server/booking-service.server");
    const { adminDb } = await import("./server/db.server");

    const { data: booking } = await context.supabase
      .from("bookings")
      .select("id, payment_status, booking_status")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (!booking) return { ok: false as const, message: "Booking not found." };
    if (booking.payment_status === "paid") return { ok: true as const, status: "paid" as const };

    const db = await adminDb();
    const { data: payment } = await db
      .from("payments")
      .select("*")
      .eq("booking_id", data.bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.checkout_request_id || !mpesaConfigured()) {
      return { ok: true as const, status: booking.payment_status, message: "Awaiting provider confirmation." };
    }

    const result = await stkQuery(payment.checkout_request_id);
    if (result.resultCode === "0") {
      await markBookingPaid(data.bookingId, payment.checkout_request_id);
      return { ok: true as const, status: "paid" as const };
    }
    if (result.resultCode && result.resultCode !== "1032" && result.resultCode !== "") {
      await db.from("payments").update({ status: "failed", raw_payload: JSON.parse(JSON.stringify(result.raw)) }).eq("id", payment.id);
      return { ok: true as const, status: "failed" as const, message: "Payment could not be verified." };
    }
    return { ok: true as const, status: "pending" as const, message: "Payment is still pending confirmation." };
  });
