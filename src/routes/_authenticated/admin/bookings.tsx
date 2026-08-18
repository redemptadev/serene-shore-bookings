import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listAllBookings } from "@/services/bookings";
import { updateBookingStatus } from "@/services/admin";
import { formatDate, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — Coastal Haven host console" },
      { name: "description", content: "Review guest bookings, payments and confirm or cancel stays." },
      { property: "og:title", content: "Bookings — Coastal Haven" },
      { property: "og:description", content: "Host tools for managing Coastal Haven bookings." },
    ],
  }),
  component: AdminBookings,
});

function AdminBookings() {
  const queryClient = useQueryClient();
  const { data: bookings, isLoading } = useQuery({ queryKey: ["admin-bookings"], queryFn: listAllBookings });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateBookingStatus>[1] }) =>
      updateBookingStatus(id, patch),
    onSuccess: () => {
      toast.success("Booking updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: () => toast.error("Could not update the booking."),
  });

  return (
    <AdminShell title="Bookings" description="Every request, payment and stay across your listings.">
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (bookings ?? []).length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">No bookings yet.</p>
      ) : (
        <div className="grid gap-4">
          {(bookings ?? []).map((booking) => (
            <Card key={booking.id}>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{booking.properties?.name ?? "Stay"}</h2>
                  <BookingStatusBadge status={booking.booking_status} />
                  <PaymentStatusBadge status={booking.payment_status} />
                  <span className="text-xs text-muted-foreground">{booking.reference}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {booking.guest_name} · {booking.guest_email}
                  {booking.guest_phone ? ` · ${booking.guest_phone}` : ""}
                </p>
                <p className="text-sm">
                  {formatDate(booking.check_in)} → {formatDate(booking.check_out)} · {booking.nights} night(s) ·{" "}
                  {booking.guests} guest(s) · {formatMoney(Number(booking.total), booking.currency)}
                </p>
                {booking.guest_notes && <p className="text-sm text-muted-foreground">“{booking.guest_notes}”</p>}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({ id: booking.id, patch: { booking_status: "confirmed", payment_status: "paid" } })
                    }
                  >
                    Mark paid &amp; confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: booking.id, patch: { booking_status: "completed" } })}
                  >
                    Mark completed
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: booking.id, patch: { booking_status: "cancelled" } })}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}