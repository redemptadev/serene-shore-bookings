import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/_authenticated/dashboard/favorites")({
  component: Favorites,
});

function Favorites() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Saved stays</h1>
        <p className="mt-2 text-muted-foreground">Stays you save will be listed here.</p>
      </div>
    </SiteLayout>
  );
}