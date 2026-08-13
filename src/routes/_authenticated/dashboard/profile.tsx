import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: Profile,
});

function Profile() {
  const { profile, user } = useAuth();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Your profile</h1>
        <dl className="mt-6 grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd>{profile?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{profile?.email ?? user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{profile?.phone ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </SiteLayout>
  );
}