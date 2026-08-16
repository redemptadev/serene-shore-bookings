import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PropertyImage } from "@/components/PropertyImage";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { getBooking, listPayments } from "@/services/bookings";
import { submitReview } from "@/services/engagement";
import { cancelMyBooking } from "@/lib/bookings.functions";
import { initiatePayment, refreshPaymentStatus } from "@/lib/payments.functions";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatMoney } from "@/lib/format";
import { Loader2, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/bookings/$id")({
  component: BookingDetail,
  head: () => ({
    meta: [
      { title: "Booking details · Coastal Haven" },
      { name: "description", content: "Booking summary, payment status and stay instructions for your Coastal Haven reservation." },
      { property: "og:title", content: "Booking details · Coastal Haven" },
      { property: "og:description", content: "Your Coastal Haven reservation summary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function BookingDetail() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const pay = useServerFn(initiatePayment);
  const refresh = useServerFn(refreshPaymentStatus);
  const cancel = useServerFn(cancelMyBooking);

  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: booking, isLoading } = useQuery({ queryKey: ["booking", id], queryFn: () => getBooking(id) });
  const { data: payments } = useQuery({ queryKey: ["payments", id], queryFn: () => listPayments(id) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["booking", id] });
    void queryClient.invalidateQueries({ queryKey: ["payments", id] });
    void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
  };

  const payNow = useMutation({
    mutationFn: () => pay({ data: { bookingId: id, provider: "mpesa" as const, phone: phone.trim() || undefined } }),
    onSuccess: (result) => {
      if (result.ok) toast.success(result.message || "Check your phone to approve the payment.");
      else toast.error(result.message);
      invalidate();
    },
    onError: () => toast.error("Payment could not be started."),
  });

  const checkStatus = useMutation({
    mutationFn: () => refresh({ data: { bookingId: id } }),
    onSuccess: (result) => {
      const message = "message" in result ? result.message : null;
      const status = "status" in result ? result.status : null;
      if (!result.ok) toast.error(message ?? "Could not check payment.");
      else if (status === "paid") toast.success("Payment confirmed — your stay is booked!");
      else toast.info(message ?? `Payment is ${status ?? "pending"}.`);
      invalidate();
    },
    onError: () => toast.error("Could not check the payment status."),
  });

  const cancelBooking = useMutation({
    mutationFn: () => cancel({ data: { bookingId: id } }),
    onSuccess: (result) => {
      if (result.ok) toast.success("Booking cancelled.");
      else toast.error(result.message);
      invalidate();
    },
    onError: () => toast.error("Could not cancel this booking."),
  });

  const review = useMutation({
    mutationFn: () =>
      submitReview({
        propertyId: booking!.property_id,
        userId: user!.id,
        bookingId: id,
        rating,
        comment: comment.trim(),
        authorName: profile?.full_name ?? null,
      }),
    onSuccess: () => {
      setComment("");
      toast.success("Thanks for your review!");
    },
    onError: () => toast.error("You can review a stay once it is completed."),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading booking…
          </p>
        </div>
      </SiteLayout>
    );
  }

  if (!booking) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold">Booking not found</h1>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to your trips</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const property = booking.properties;
  const cover = [...(property?.property_images ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  )[0];
  const canPay = booking.payment_status !== "paid" && booking.booking_status !== "cancelled";
  const canCancel = booking.booking_status === "pending" || booking.booking_status === "confirmed";

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl font-semibold">{property?.name ?? "Your stay"}</h1>
          <BookingStatusBadge status={booking.booking_status} />
          <PaymentStatusBadge status={booking.payment_status} />
        </div>

        <div className="h-56 overflow-hidden rounded-2xl">
          <PropertyImage image={cover ?? null} alt={property?.name ?? "Stay"} loading="eager" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stay summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Reference" value={booking.reference} />
            <Detail label="Guests" value={String(booking.guests)} />
            <Detail label="Check-in" value={`${formatDate(booking.check_in)} · from ${property?.check_in_time ?? "14:00"}`} />
            <Detail label="Check-out" value={`${formatDate(booking.check_out)} · by ${property?.check_out_time ?? "10:00"}`} />
            <Detail label="Nights" value={String(booking.nights)} />
            <Detail label="Location" value={property?.location || "Kilifi, Kenya"} />
            <Separator className="sm:col-span-2" />
            <Detail label="Accommodation" value={formatMoney(Number(booking.subtotal), booking.currency)} />
            <Detail label="Fees" value={formatMoney(Number(booking.fees), booking.currency)} />
            <div className="sm:col-span-2 flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">{formatMoney(Number(booking.total), booking.currency)}</span>
            </div>
          </CardContent>
        </Card>

        {canPay && (
          <Card>
            <CardHeader>
              <CardTitle>Pay with M-Pesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">M-Pesa phone number</Label>
                <Input
                  id="phone"
                  placeholder="+254700000000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => payNow.mutate()} disabled={payNow.isPending}>
                  {payNow.isPending ? "Sending request…" : `Pay ${formatMoney(Number(booking.total), booking.currency)}`}
                </Button>
                <Button variant="outline" onClick={() => checkStatus.mutate()} disabled={checkStatus.isPending}>
                  {checkStatus.isPending ? "Checking…" : "I've paid — check status"}
                </Button>
              </div>
              {(payments ?? []).length > 0 && (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {(payments ?? []).map((payment) => (
                    <li key={payment.id}>
                      {payment.provider.toUpperCase()} · {formatMoney(Number(payment.amount), payment.currency)} ·{" "}
                      {payment.status} · {formatDate(payment.created_at)}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {booking.booking_status === "completed" && (
          <Card>
            <CardHeader>
              <CardTitle>Leave a review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} star`}
                    onClick={() => setRating(value)}
                    className="p-1"
                  >
                    <Star className={value <= rating ? "h-6 w-6 fill-accent text-accent" : "h-6 w-6 text-muted-foreground"} />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Tell other guests about your stay…"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
              />
              <Button onClick={() => review.mutate()} disabled={review.isPending || comment.trim().length < 3}>
                {review.isPending ? "Publishing…" : "Publish review"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to trips</Link>
          </Button>
          {property?.slug && (
            <Button asChild variant="ghost">
              <Link to="/stays/$slug" params={{ slug: property.slug }}>
                View listing
              </Link>
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={() => cancelBooking.mutate()} disabled={cancelBooking.isPending}>
              {cancelBooking.isPending ? "Cancelling…" : "Cancel booking"}
            </Button>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
