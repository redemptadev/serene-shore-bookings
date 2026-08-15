import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyCard } from "@/components/PropertyCard";
import { useAuth } from "@/hooks/useAuth";
import { listFavorites, toggleFavorite } from "@/services/engagement";
import { useSettings } from "@/hooks/useSettings";
import type { PropertyListItem } from "@/types";
import { Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/favorites")({
  component: Favorites,
  head: () => ({
    meta: [
      { title: "Saved stays · Coastal Haven" },
      { name: "description", content: "Your shortlist of Coastal Haven beach houses and villas in Kilifi." },
      { property: "og:title", content: "Saved stays · Coastal Haven" },
      { property: "og:description", content: "Your shortlisted coastal stays." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Favorites() {
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => listFavorites(user!.id),
    enabled: Boolean(user?.id),
  });

  const remove = useMutation({
    mutationFn: (propertyId: string) => toggleFavorite(user!.id, propertyId, true),
    onSuccess: () => {
      toast.success("Removed from saved stays");
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => toast.error("Could not update your saved stays"),
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">Saved stays</h1>
        <p className="mt-1 text-muted-foreground">Your shortlist for the next coastal escape.</p>

        {isLoading ? (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : (favorites ?? []).length === 0 ? (
          <Card className="mt-8">
            <CardContent className="space-y-4 p-8 text-center">
              <p className="text-muted-foreground">You haven't saved any stays yet.</p>
              <Button asChild>
                <Link to="/stays">Browse stays</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(favorites ?? []).map((favorite) => {
              const property = favorite.properties as unknown as PropertyListItem | null;
              if (!property) return null;
              return (
                <div key={favorite.id} className="space-y-2">
                  <PropertyCard
                    property={{ ...property, rating_average: null, rating_count: 0 }}
                    currency={settings?.currency ?? "KES"}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => remove.mutate(property.id)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
