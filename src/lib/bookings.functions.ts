import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const quoteSchema = z.object({
  propertyId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const createSchema = quoteSchema.extend({
  guests: z.number().int().min(1).max(50),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(255),
  guestPhone: z.string().trim().max(30).optional().or(z.literal("")),
  guestNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const getBookingQuote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => quoteSchema.parse(data))
  .handler(async ({ data }) => {
    const { computeQuote, BookingError } = await import("./server/booking-service.server");
    try {
      const { quote, property } = await computeQuote(data.propertyId, data.checkIn, data.checkOut);
      return { ok: true as const, quote, minNights: property.min_nights, maxGuests: property.max_guests };
    } catch (error) {
      return { ok: false as const, message: error instanceof BookingError ? error.message : "Unable to price these dates." };
    }
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const service = await import("./server/booking-service.server");
    try {
      const { property, quote, settings } = await service.computeQuote(data.propertyId, data.checkIn, data.checkOut);
      if (data.guests > property.max_guests) {
        return { ok: false as const, message: `This property hosts up to ${property.max_guests} guests.` };
      }
      await service.assertAvailable(data.propertyId, data.checkIn, data.checkOut);

      const { data: booking, error } = await context.supabase
        .from("bookings")
        .insert({
          user_id: context.userId,
          property_id: data.propertyId,
          guest_name: data.guestName,
          guest_email: data.guestEmail,
          guest_phone: data.guestPhone || null,
          guest_notes: data.guestNotes || null,
          check_in: data.checkIn,
          check_out: data.checkOut,
          guests: data.guests,
          nights: quote.nights,
          subtotal: quote.subtotal,
          fees: quote.fees,
          total: quote.total,
          currency: settings.currency,
        })
        .select("id, reference, total, currency")
        .single();

      if (error) return { ok: false as const, message: service.friendlyDbError(error.message) };
      await service.announceBookingEvent("created", booking.id);
      return { ok: true as const, booking };
    } catch (error) {
      const message =
        error instanceof service.BookingError ? error.message : "Unable to complete your booking. Please try again.";
      return { ok: false as const, message };
    }
  });

export const cancelMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const service = await import("./server/booking-service.server");
    const { data: booking, error: readError } = await context.supabase
      .from("bookings")
      .select("id, booking_status, payment_status")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (readError || !booking) return { ok: false as const, message: "Booking not found." };
    if (booking.booking_status === "cancelled") return { ok: true as const };
    if (booking.booking_status === "completed") {
      return { ok: false as const, message: "Completed stays cannot be cancelled." };
    }

    const { error } = await context.supabase
      .from("bookings")
      .update({ booking_status: "cancelled" })
      .eq("id", data.bookingId);
    if (error) return { ok: false as const, message: "Unable to cancel this booking. Please try again." };
    await service.announceBookingEvent("cancelled", data.bookingId);
    return { ok: true as const };
  });

const adminUpdateSchema = z.object({
  bookingId: z.string().uuid(),
  bookingStatus: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

export const adminUpdateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => adminUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const service = await import("./server/booking-service.server");
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { ok: false as const, message: "Not authorised." };

    const patch: { booking_status?: typeof data.bookingStatus; payment_status?: typeof data.paymentStatus } = {};
    if (data.bookingStatus) patch.booking_status = data.bookingStatus;
    if (data.paymentStatus) patch.payment_status = data.paymentStatus;
    if (Object.keys(patch).length === 0) return { ok: true as const };

    const { error } = await context.supabase.from("bookings").update(patch).eq("id", data.bookingId);
    if (error) return { ok: false as const, message: service.friendlyDbError(error.message) };

    if (data.bookingStatus === "confirmed") await service.announceBookingEvent("confirmed", data.bookingId);
    if (data.bookingStatus === "cancelled") await service.announceBookingEvent("cancelled", data.bookingId);
    if (data.bookingStatus === "completed") await service.announceBookingEvent("completed", data.bookingId);
    if (data.paymentStatus === "failed") await service.announceBookingEvent("payment_failed", data.bookingId);
    return { ok: true as const };
  });

const adminCreateSchema = createSchema.extend({
  bookingStatus: z.enum(["pending", "confirmed"]).default("confirmed"),
  paymentStatus: z.enum(["pending", "paid"]).default("pending"),
});

export const adminCreateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => adminCreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const service = await import("./server/booking-service.server");
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { ok: false as const, message: "Not authorised." };
    try {
      const { quote, settings } = await service.computeQuote(data.propertyId, data.checkIn, data.checkOut);
      const { data: booking, error } = await context.supabase
        .from("bookings")
        .insert({
          user_id: null,
          property_id: data.propertyId,
          guest_name: data.guestName,
          guest_email: data.guestEmail,
          guest_phone: data.guestPhone || null,
          guest_notes: data.guestNotes || null,
          check_in: data.checkIn,
          check_out: data.checkOut,
          guests: data.guests,
          nights: quote.nights,
          subtotal: quote.subtotal,
          fees: quote.fees,
          total: quote.total,
          currency: settings.currency,
          booking_status: data.bookingStatus,
          payment_status: data.paymentStatus,
          created_by_admin: true,
        })
        .select("id, reference")
        .single();
      if (error) return { ok: false as const, message: service.friendlyDbError(error.message) };
      return { ok: true as const, booking };
    } catch (error) {
      const message = error instanceof service.BookingError ? error.message : "Unable to create this booking.";
      return { ok: false as const, message };
    }
  });
