import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { listPublishedProperties } from "@/services/properties";
import { useSettings } from "@/hooks/useSettings";

interface StaySearch {
  q?: string | undefined;
  checkIn?: string | undefined;
  checkOut?: string | undefined;
  guests?: number | undefined;
  maxPrice?: number | undefined;
}

export const Route = createFileRoute("/stays/")({
  validateSearch: (search: Record<string, unknown>): StaySearch => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    checkIn: typeof search["checkIn"] === "string" ? search["checkIn"] : undefined,
    checkOut: typeof search["checkOut"] === "string" ? search["checkOut"] : undefined,
    guests: Number(search["guests"]) > 0 ? Number(search["guests"]) : undefined,
    maxPrice: Number(search["maxPrice"]) > 0 ? Number(search["maxPrice"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All stays — Coastal Haven, Kilifi" },
      {
        name: "description",
        content: "Browse every Coastal Haven stay in Kilifi: villas, cottages and beach houses with live availability.",
      },
      { property: "og:title", content: "All stays — Coastal Haven, Kilifi" },
      { property: "og:description", content: "Filter by dates, guests and budget, then book instantly." },
    ],
  }),
  component: Stays,
});

function Stays() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: settings } = useSettings();

  const [form, setForm] = useState({
    q: search.q ?? "",
    checkIn: search.checkIn ?? "",
    checkOut: search.checkOut ?? "",
    guests: search.guests ?? 1,
    maxPrice: search.maxPrice ?? 0,
  });

  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties", search],
    queryFn: () =>
      listPublishedProperties({
        ...(search.q ? { query: search.q } : {}),
        ...(search.guests ? { guests: search.guests } : {}),
        ...(search.maxPrice ? { maxPrice: search.maxPrice } : {}),
        ...(search.checkIn ? { checkIn: search.checkIn } : {}),
        ...(search.checkOut ? { checkOut: search.checkOut } : {}),
      }),
  });

  function apply() {
    navigate({
      search: {
        ...(form.q ? { q: form.q } : {}),
        ...(form.checkIn ? { checkIn: form.checkIn } : {}),
        ...(form.checkOut ? { checkOut: form.checkOut } : {}),
        ...(form.guests > 1 ? { guests: form.guests } : {}),
        ...(form.maxPrice > 0 ? { maxPrice: form.maxPrice } : {}),
      },
    });
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Stays in {settings?.location_info ?? "Kilifi, Kenya"}</h1>
        <p className="mt-2 text-muted-foreground">Every home is hosted directly — no agency, no hidden fees.</p>

        <div className="mt-6 grid gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid gap-1.5 lg:col-span-2">
            <Label htmlFor="filter-q">Search</Label>
            <Input id="filter-q" value={form.q} onChange={(event) => setForm({ ...form, q: event.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-in">Check in</Label>
            <Input
              id="filter-in"
              type="date"
              value={form.checkIn}
              onChange={(event) => setForm({ ...form, checkIn: event.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-out">Check out</Label>
            <Input
              id="filter-out"
              type="date"
              value={form.checkOut}
              onChange={(event) => setForm({ ...form, checkOut: event.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-guests">Guests</Label>
            <div className="flex gap-2">
              <Input
                id="filter-guests"
                type="number"
                min={1}
                value={form.guests}
                onChange={(event) => setForm({ ...form, guests: Math.max(1, Number(event.target.value) || 1) })}
              />
              <Button onClick={apply} aria-label="Apply filters">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-2xl" />)}
          {properties?.map((property) => (
            <PropertyCard key={property.id} property={property} currency={settings?.currency ?? "KES"} />
          ))}
        </div>

        {!isLoading && (properties?.length ?? 0) === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold">No stays match yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Listings are added by the host. Adjust your dates or check back soon.
            </p>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}