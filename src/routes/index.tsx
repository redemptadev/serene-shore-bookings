import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Search, ShieldCheck, Sparkles, Waves } from "lucide-react";
import heroImage from "@/assets/hero-coast.jpg";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { listFeaturedProperties } from "@/services/properties";
import { useSettings } from "@/hooks/useSettings";
import { toDateInput } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coastal Haven — Boutique beach stays in Kilifi, Kenya" },
      {
        name: "description",
        content:
          "Ocean-front villas and beach houses in Kilifi, Kenya. Live availability, transparent pricing and M-Pesa payments.",
      },
      { property: "og:title", content: "Coastal Haven — Boutique beach stays in Kilifi" },
      { property: "og:description", content: "Browse ocean-front homes on Kenya's Kilifi coast and book in minutes." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured-properties"],
    queryFn: () => listFeaturedProperties(6),
  });

  const [query, setQuery] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Coastal villa terrace overlooking the Indian Ocean at sunset in Kilifi"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero opacity-80" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-primary-foreground sm:py-32">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] opacity-90">
            <Waves className="h-4 w-4" /> {settings?.location_info ?? "Kilifi, Kenya"}
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">
            {settings?.business_name ?? "Coastal Haven"} — wake up to the Indian Ocean
          </h1>
          <p className="mt-4 max-w-xl text-base opacity-95 sm:text-lg">
            {settings?.business_description ?? "Boutique coastal stays in Kilifi, Kenya."}
          </p>

          <div className="mt-10 grid gap-3 rounded-2xl border bg-background/95 p-4 text-foreground shadow-lift sm:grid-cols-2 lg:grid-cols-5">
            <div className="grid gap-1.5 lg:col-span-2">
              <Label htmlFor="home-query">Where to</Label>
              <Input
                id="home-query"
                placeholder="Kilifi, beach house…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="home-in">Check in</Label>
              <Input
                id="home-in"
                type="date"
                min={toDateInput(new Date())}
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="home-out">Check out</Label>
              <Input
                id="home-out"
                type="date"
                min={checkIn || toDateInput(new Date())}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="home-guests">Guests</Label>
              <div className="flex gap-2">
                <Input
                  id="home-guests"
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))}
                />
                <Button
                  aria-label="Search stays"
                  onClick={() =>
                    navigate({
                      to: "/stays",
                      search: {
                        ...(query ? { q: query } : {}),
                        ...(checkIn ? { checkIn } : {}),
                        ...(checkOut ? { checkOut } : {}),
                        guests,
                      },
                    })
                  }
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold">Featured stays</h2>
            <p className="mt-1 text-muted-foreground">Hand-picked homes along the Kilifi creek and coastline.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/stays">View all stays</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-2xl" />)}
          {featured?.map((property) => (
            <PropertyCard key={property.id} property={property} currency={settings?.currency ?? "KES"} />
          ))}
        </div>

        {!isLoading && (featured?.length ?? 0) === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
            <h3 className="text-lg font-semibold">No stays published yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              The host is preparing the first listings. Check back shortly, or get in touch to enquire about dates.
            </p>
            <Button asChild className="mt-5">
              <Link to="/contact">Contact the host</Link>
            </Button>
          </div>
        )}
      </section>

      <section className="gradient-surface border-y">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3">
          {[
            {
              icon: CalendarRange,
              title: "Live availability",
              body: "Calendars sync with every booking, so double-bookings can't happen.",
            },
            {
              icon: ShieldCheck,
              title: "Secure payments",
              body: "Pay with M-Pesa or card. Your stay is confirmed the moment payment clears.",
            },
            {
              icon: Sparkles,
              title: "Hosted with care",
              body: "Local host, spotless homes, and a WhatsApp line for anything you need.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-card p-6 shadow-soft">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}