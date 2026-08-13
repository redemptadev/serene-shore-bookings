import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Your trips</h1>
        <p className="mt-2 text-muted-foreground">Upcoming and past stays appear here once you book.</p>
        <Button asChild className="mt-6">
          <Link to="/stays">Find a stay</Link>
        </Button>
      </div>
    </SiteLayout>
  );
}