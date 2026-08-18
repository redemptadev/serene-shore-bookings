import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listAllProperties } from "@/services/properties";
import { listAllBookings } from "@/services/bookings";
import { formatDate, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Host console — Coastal Haven" },
      { name: "description", content: "Overview of Coastal Haven listings, bookings and revenue at a glance." },
      { property: "og:title", content: "Host console — Coastal Haven" },
      { property: "og:description", content: "Manage Coastal Haven listings, bookings and revenue." },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const { data: properties, isLoading: loadingProperties } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: listAllProperties,
  });
  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: listAllBookings,
  });

  const all = bookings ?? [];
  const paid = all.filter((booking) => booking.payment_status === "paid");
  const revenue = paid.reduce((sum, booking) => sum + Number(booking.total), 0);
  const pending = all.filter((booking) => booking.booking_status === "pending");
  const published = (properties ?? []).filter((property) => property.status === "published");

  const stats = [
    { label: "Listings", value: `${published.length}/${properties?.length ?? 0} published` },
    { label: "Bookings", value: String(all.length) },
    { label: "Awaiting payment", value: String(pending.length) },
    { label: "Revenue collected", value: formatMoney(revenue) },
  ];

  return (
    <AdminShell title="Overview" description="Your stays, requests and revenue at a glance.">
      {loadingProperties || loadingBookings ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Latest bookings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {all.slice(0, 6).map((booking) => (
                <div key={booking.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
                  <strong>{booking.properties?.name ?? "Stay"}</strong>
                  <span className="text-muted-foreground">
                    {booking.guest_name} · {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                  </span>
                  <BookingStatusBadge status={booking.booking_status} />
                  <PaymentStatusBadge status={booking.payment_status} />
                  <span className="ml-auto font-medium">{formatMoney(Number(booking.total), booking.currency)}</span>
                </div>
              ))}
              {all.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No bookings yet. <Link to="/admin/properties" className="underline">Publish a listing</Link> to start taking
                  reservations.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminShell>
  );
}