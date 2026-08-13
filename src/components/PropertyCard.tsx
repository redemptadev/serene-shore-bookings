import { Link } from "@tanstack/react-router";
import { MapPin, Star, Users } from "lucide-react";
import { PropertyImage } from "@/components/PropertyImage";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import type { PropertyListItem } from "@/types";

export function PropertyCard({ property, currency = "KES" }: { property: PropertyListItem; currency?: string }) {
  const cover = property.property_images?.[0] ?? null;

  return (
    <Link
      to="/stays/$slug"
      params={{ slug: property.slug }}
      className="group block overflow-hidden rounded-2xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PropertyImage image={cover} alt={property.name} className="transition duration-500 group-hover:scale-105" />
        {property.is_featured && (
          <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">Featured</Badge>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight">{property.name}</h3>
          {property.rating_count > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {property.rating_average?.toFixed(1)}
            </span>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {property.location || "Kilifi, Kenya"}
        </p>
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            <span className="text-base font-semibold text-foreground">
              {formatMoney(Number(property.base_price), currency)}
            </span>{" "}
            / night
          </p>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {property.max_guests}
          </span>
        </div>
      </div>
    </Link>
  );
}