import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Shield, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { initials } from "@/lib/format";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/stays", label: "Stays" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { data: settings } = useSettings();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-hero text-primary-foreground">
            <Waves className="h-5 w-5" />
          </span>
          {settings?.business_name ?? "Coastal Haven"}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-sm font-medium text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials(profile?.full_name ?? user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>My trips</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/favorites" })}>Saved stays</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/profile" })}>Profile</DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                      <Shield className="mr-2 h-4 w-4" /> Host dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="mt-10 grid gap-1">
                {NAV.map((item) => (
                  <Link key={item.to} to={item.to} className="rounded-lg px-3 py-2 text-base hover:bg-muted">
                    {item.label}
                  </Link>
                ))}
                {user && (
                  <Link to="/dashboard" className="rounded-lg px-3 py-2 text-base hover:bg-muted">
                    My trips
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="rounded-lg px-3 py-2 text-base hover:bg-muted">
                    Host dashboard
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}