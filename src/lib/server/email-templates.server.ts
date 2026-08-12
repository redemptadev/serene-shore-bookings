interface BookingEmailData {
  guestName: string;
  propertyName: string;
  location?: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  reference: string;
  amount: string;
  hostName?: string | null;
  hostEmail?: string | null;
  hostPhone?: string | null;
  checkInInstructions?: string | null;
  businessName: string;
}

function layout(title: string, intro: string, rows: [string, string][], footer: string, cta?: string) {
  const rowHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0;color:#5b7183;font-size:13px;">${label}</td><td style="padding:10px 0;text-align:right;color:#0f2c3f;font-size:14px;font-weight:600;">${value}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f8fa;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="background:linear-gradient(135deg,#0f4c66,#2fb6c4);border-radius:20px 20px 0 0;padding:32px;color:#fff;">
      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.85;">Coastal Haven</div>
      <h1 style="margin:12px 0 0;font-size:26px;font-weight:600;">${title}</h1>
    </div>
    <div style="background:#fff;padding:32px;border-radius:0 0 20px 20px;">
      <p style="color:#365468;font-size:15px;line-height:1.6;margin-top:0;">${intro}</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e6eef2;margin:8px 0 20px;">${rowHtml}</table>
      ${cta ? `<p style="color:#365468;font-size:14px;line-height:1.6;">${cta}</p>` : ""}
      <p style="color:#87a0b0;font-size:12px;line-height:1.6;margin-bottom:0;">${footer}</p>
    </div>
  </div></body></html>`;
}

export function bookingConfirmedEmail(data: BookingEmailData) {
  return {
    subject: `Your ${data.businessName} booking is confirmed 🌊`,
    html: layout(
      "Your booking is confirmed 🌊",
      `Karibu ${data.guestName}, your coastal escape is locked in. Here are your stay details.`,
      [
        ["Property", data.propertyName + (data.location ? ` — ${data.location}` : "")],
        ["Check-in", data.checkIn],
        ["Check-out", data.checkOut],
        ["Guests", String(data.guests)],
        ["Booking reference", data.reference],
        ["Amount paid", data.amount],
      ],
      `Host: ${data.hostName ?? data.businessName} · ${data.hostEmail ?? ""} ${data.hostPhone ?? ""}`,
      data.checkInInstructions ? `<strong>Check-in instructions:</strong> ${data.checkInInstructions}` : undefined,
    ),
  };
}

export function bookingCreatedEmail(data: BookingEmailData) {
  return {
    subject: `We're holding your stay at ${data.propertyName}`,
    html: layout(
      "Your booking request is held",
      `Hi ${data.guestName}, we have reserved these dates for a short while. Complete payment to confirm your stay.`,
      [
        ["Property", data.propertyName],
        ["Check-in", data.checkIn],
        ["Check-out", data.checkOut],
        ["Guests", String(data.guests)],
        ["Booking reference", data.reference],
        ["Amount due", data.amount],
      ],
      `Questions? Reply to this email or contact ${data.hostEmail ?? ""}.`,
    ),
  };
}

export function bookingCancelledEmail(data: BookingEmailData) {
  return {
    subject: `Booking ${data.reference} cancelled`,
    html: layout(
      "Your booking has been cancelled",
      `Hi ${data.guestName}, booking ${data.reference} for ${data.propertyName} has been cancelled.`,
      [
        ["Property", data.propertyName],
        ["Check-in", data.checkIn],
        ["Check-out", data.checkOut],
        ["Booking reference", data.reference],
      ],
      "If this was a mistake, contact your host and we will do our best to re-open the dates.",
    ),
  };
}

export function paymentFailedEmail(data: BookingEmailData) {
  return {
    subject: `Payment could not be verified — ${data.reference}`,
    html: layout(
      "Payment not verified",
      `Hi ${data.guestName}, we could not verify payment for booking ${data.reference}. Your booking is not confirmed yet.`,
      [
        ["Property", data.propertyName],
        ["Amount due", data.amount],
        ["Booking reference", data.reference],
      ],
      "You can retry payment from your dashboard at any time.",
    ),
  };
}

export function reviewInviteEmail(data: BookingEmailData) {
  return {
    subject: `How was ${data.propertyName}?`,
    html: layout(
      "Share your stay",
      `Hi ${data.guestName}, thank you for staying with us. A short review helps future guests choose their coastal escape.`,
      [
        ["Property", data.propertyName],
        ["Stay", `${data.checkIn} → ${data.checkOut}`],
      ],
      "Leave a review from your Coastal Haven dashboard.",
    ),
  };
}

export function hostAlertEmail(subject: string, message: string, rows: [string, string][]) {
  return { subject, html: layout(subject, message, rows, "Coastal Haven host alert") };
}
