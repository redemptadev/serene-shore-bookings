import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const LINKS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/properties", label: "Listings", exact: false },
  { to: "/admin/bookings", label: "Bookings", exact: false },
  { to: "/admin/calendar", label: "Calendar", exact: false },
  { to: "/admin/reviews", label: "Reviews", exact: false },
  { to: "/admin/settings", label: "Settings", exact: false },
] as const;

export function AdminShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const { isAdmin, loading, user } = useAuth();

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <p className="text-sm font-medium text-primary">Host console</p>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 border-b pb-3">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.exact }}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted"
              activeProps={{ className: "rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {loading || !user ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : isAdmin ? (
          children
        ) : (
          <p className="rounded-xl border bg-card p-6 text-muted-foreground">
            This area is for the property host only.
          </p>
        )}
      </div>
    </SiteLayout>
  );
}
