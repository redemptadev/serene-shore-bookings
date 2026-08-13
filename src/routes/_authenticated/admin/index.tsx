import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { isAdmin } = useAuth();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Host console</h1>
        {isAdmin ? (
          <p className="mt-2 text-muted-foreground">
            Listing manager, calendar and booking tools land here next. No demo listings are seeded — you add each stay yourself.
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">This area is for the property host only.</p>
        )}
      </div>
    </SiteLayout>
  );
}