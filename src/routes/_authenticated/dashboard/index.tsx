import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyImage } from "@/components/PropertyImage";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { listMyBookings } from "@/services/bookings";
import { formatDate, formatMoney } from "@/lib/format";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
  head: () => ({
    meta: [
      { title: "Your trips · Coastal Haven" },
      { name: "description", content: "Review upcoming and past Coastal Haven stays, payments and booking references." },
      { property: "og:title", content: "Your trips · Coastal Haven" },
      { property: "og:description", content: "Manage your Kilifi coastal stays and payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DashboardHome() {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: () => listMyBookings(user!.id),
    enabled: Boolean(user?.id),
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (bookings ?? []).filter((b) => b.check_out >= today && b.booking_status !== "cancelled");
  const past = (bookings ?? []).filter((b) => b.check_out < today || b.booking_status === "cancelled");

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Your trips</h1>
            <p className="mt-1 text-muted-foreground">Bookings, payments and references in one place.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/dashboard/favorites">Saved stays</Link>
            </Button>
            <Button asChild>
              <Link to="/stays">Find a stay</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your trips…
          </p>
        ) : (bookings ?? []).length === 0 ? (
          <Card className="mt-10">
            <CardContent className="p-8 text-center text-muted-foreground">
              No bookings yet. Browse the stays and reserve your dates.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-10">
            <Section title="Upcoming" bookings={upcoming} />
            <Section title="Past & cancelled" bookings={past} />
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

type BookingRow = Awaited<ReturnType<typeof listMyBookings>>[number];

function Section({ title, bookings }: { title: string; bookings: BookingRow[] }) {
  if (bookings.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="grid gap-4">
        {bookings.map((booking) => {
          const property = booking.properties;
          const cover = [...(property?.property_images ?? [])].sort(
            (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
          )[0];
          return (
            <Link
              key={booking.id}
              to="/dashboard/bookings/$id"
              params={{ id: booking.id }}
              className="flex flex-col gap-4 rounded-2xl border bg-card p-4 transition hover:shadow-lift sm:flex-row"
            >
              <div className="h-32 w-full overflow-hidden rounded-xl sm:w-44">
                <PropertyImage image={cover ?? null} alt={property?.name ?? "Stay"} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{property?.name ?? "Stay"}</h3>
                  <BookingStatusBadge status={booking.booking_status} />
                  <PaymentStatusBadge status={booking.payment_status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(booking.check_in)} → {formatDate(booking.check_out)} · {booking.nights} night(s) ·{" "}
                  {booking.guests} guest(s)
                </p>
                <p className="text-sm text-muted-foreground">Reference {booking.reference}</p>
                <p className="font-semibold">{formatMoney(Number(booking.total), booking.currency)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
