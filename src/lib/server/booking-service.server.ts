import { buildQuote } from "@/lib/pricing";
import { formatMoney, nightsBetween } from "@/lib/format";
import { adminDb, publicDb, type Db } from "./db.server";
import { notifyGuest, notifyHost } from "./notify.server";
import {
  bookingCancelledEmail,
  bookingConfirmedEmail,
  bookingCreatedEmail,
  paymentFailedEmail,
  reviewInviteEmail,
} from "./email-templates.server";
import type { AdminSettings, Booking, Quote } from "@/types";

export class BookingError extends Error {}

export async function loadSettings(db?: Db): Promise<AdminSettings> {
  const client = db ?? publicDb();
  const { data } = await client.from("admin_settings").select("*").eq("id", true).maybeSingle();
  if (!data) throw new BookingError("Settings are unavailable. Please try again.");
  return data;
}

export async function computeQuote(propertyId: string, checkIn: string, checkOut: string) {
  const db = publicDb();
  const [{ data: property }, { data: rules }, settings] = await Promise.all([
    db.from("properties").select("*").eq("id", propertyId).maybeSingle(),
    db.from("pricing_rules").select("*").eq("property_id", propertyId),
    loadSettings(db),
  ]);
  if (!property) throw new BookingError("This property is no longer available.");
  if (property.status !== "published") throw new BookingError("This property is not accepting bookings right now.");
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new BookingError("Please choose a check-out date after your check-in date.");
  if (nights < property.min_nights) {
    throw new BookingError(`This property has a minimum stay of ${property.min_nights} night(s).`);
  }
  const quote = buildQuote(property, rules ?? [], checkIn, checkOut, settings.currency);
  return { property, quote, settings };
}

export async function assertAvailable(propertyId: string, checkIn: string, checkOut: string) {
  const db = publicDb();
  const { data, error } = await db.rpc("is_range_available", {
    _property_id: propertyId,
    _check_in: checkIn,
    _check_out: checkOut,
  });
  if (error) throw new BookingError("We could not verify availability. Please try again.");
  if (data !== true) throw new BookingError("These dates are no longer available.");
}

export function friendlyDbError(message: string) {
  if (message.includes("no_overlapping_active_bookings") || message.includes("conflicting key")) {
    return "These dates were just taken by another guest. Please choose different dates.";
  }
  if (message.includes("not available")) return "These dates are not available.";
  return "Unable to complete your booking. Please try again.";
}

interface BookingWithProperty extends Booking {
  properties?: { name: string; location: string | null } | null;
}

function emailData(booking: BookingWithProperty, settings: AdminSettings) {
  return {
    guestName: booking.guest_name || "Guest",
    propertyName: booking.properties?.name ?? "your stay",
    location: booking.properties?.location ?? null,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    guests: booking.guests,
    reference: booking.reference,
    amount: formatMoney(Number(booking.total), booking.currency),
    hostName: settings.host_name,
    hostEmail: settings.host_email,
    hostPhone: settings.host_phone,
    checkInInstructions: settings.check_in_instructions,
    businessName: settings.business_name,
  };
}

export async function announceBookingEvent(
  event: "created" | "confirmed" | "cancelled" | "payment_failed" | "completed",
  bookingId: string,
) {
  const db = await adminDb();
  const { data: booking } = await db
    .from("bookings")
    .select("*, properties(name, location)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return;
  const settings = await loadSettings(db);
  const data = emailData(booking as BookingWithProperty, settings);

  const guestMail = {
    created: bookingCreatedEmail(data),
    confirmed: bookingConfirmedEmail(data),
    cancelled: bookingCancelledEmail(data),
    payment_failed: paymentFailedEmail(data),
    completed: reviewInviteEmail(data),
  }[event];

  const titles: Record<typeof event, string> = {
    created: "Booking held — complete payment to confirm",
    confirmed: "Your booking is confirmed 🌊",
    cancelled: "Booking cancelled",
    payment_failed: "Payment could not be verified",
    completed: "How was your stay?",
  };

  const guest = await notifyGuest({
    userId: booking.user_id,
    email: booking.guest_email,
    title: titles[event],
    body: `${data.propertyName} · ${data.checkIn} → ${data.checkOut} · ${data.reference}`,
    kind: event,
    bookingId,
    mail: guestMail,
    replyTo: settings.host_email,
  });

  const host = await notifyHost({
    title:
      event === "created"
        ? `New booking request · ${data.reference}`
        : event === "confirmed"
          ? `Payment received · ${data.reference}`
          : event === "cancelled"
            ? `Booking cancelled · ${data.reference}`
            : event === "payment_failed"
              ? `Failed payment · ${data.reference}`
              : `Stay completed · ${data.reference}`,
    body: `${data.propertyName} · ${data.checkIn} → ${data.checkOut} · ${data.guests} guest(s) · ${data.amount}`,
    kind: event,
    bookingId,
    rows: [
      ["Guest", `${data.guestName} (${booking.guest_email})`],
      ["Property", data.propertyName],
      ["Dates", `${data.checkIn} → ${data.checkOut}`],
      ["Total", data.amount],
      ["Reference", data.reference],
    ],
    hostEmail: settings.host_email,
    whatsappNumber: settings.whatsapp_number,
  });

  return { guest, host };
}

export async function markBookingPaid(bookingId: string, providerReference?: string | null) {
  const db = await adminDb();
  const { data: booking } = await db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (!booking) return;
  if (booking.payment_status === "paid" && booking.booking_status === "confirmed") return;
  await db
    .from("bookings")
    .update({ payment_status: "paid", booking_status: "confirmed" })
    .eq("id", bookingId);
  if (providerReference) {
    await db
      .from("payments")
      .update({ status: "paid", provider_reference: providerReference })
      .eq("booking_id", bookingId)
      .eq("status", "pending");
  }
  await announceBookingEvent("confirmed", bookingId);
}

export type { Quote };
