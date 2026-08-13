import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PropertyImage } from "@/components/PropertyImage";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyBySlug } from "@/services/properties";
import { useSettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/stays/$slug")({
  head: () => ({
    meta: [
      { title: "Stay details — Coastal Haven Kilifi" },
      { name: "description", content: "Photos, amenities, house rules and live availability for this Coastal Haven stay." },
      { property: "og:title", content: "Stay details — Coastal Haven" },
      { property: "og:description", content: "See photos, amenities and book this coastal stay in Kilifi, Kenya." },
    ],
  }),
  component: StayDetail,
});

function StayDetail() {
  const { slug } = Route.useParams();
  const { data: settings } = useSettings();
  const { data: property, isLoading } = useQuery({
    queryKey: ["property", slug],
    queryFn: () => getPropertyBySlug(slug),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </SiteLayout>
    );
  }

  if (!property) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Stay not found</h1>
          <p className="mt-2 text-muted-foreground">
            This listing may have been unpublished. <Link to="/stays" className="underline">Browse all stays</Link>.
          </p>
        </div>
      </SiteLayout>
    );
  }

  const images = property.property_images ?? [];

  return (
    <SiteLayout>
      <article className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{property.name}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {property.location}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" /> Up to {property.max_guests} guests
          </span>
          <span>
            {property.bedrooms} bedrooms · {property.beds} beds · {property.bathrooms} baths
          </span>
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {images.slice(0, 3).map((image, index) => (
            <PropertyImage
              key={image.id}
              image={image}
              alt={image.alt_text ?? `${property.name} photo ${index + 1}`}
              className="h-64 w-full rounded-2xl object-cover"
            />
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="text-xl font-semibold">About this stay</h2>
            <p className="mt-3 whitespace-pre-line text-muted-foreground">{property.description}</p>

            {property.amenities.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {property.house_rules.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold">House rules</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {property.house_rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <BookingWidget property={property} currency={settings?.currency ?? "KES"} />
          </div>
        </div>
      </article>
    </SiteLayout>
  );
}