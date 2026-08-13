import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Waves } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

interface AuthSearch {
  redirect?: string | undefined;
}

function safePath(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Coastal Haven" },
      { name: "description", content: "Sign in or create your Coastal Haven account to book and manage coastal stays." },
      { property: "og:title", content: "Sign in — Coastal Haven" },
      { property: "og:description", content: "Access your bookings, saved stays and trip details." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const destination = safePath(redirect);

  useEffect(() => {
    if (user) navigate({ to: destination, replace: true });
  }, [user, destination, navigate]);

  async function signInWithGoogle() {
    setBusy(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch {
      toast.error("Google sign-in is unavailable right now.");
    } finally {
      setBusy(false);
    }
  }

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: destination, replace: true });
  }

  async function signUp() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your inbox to confirm your email, then sign in.");
  }

  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-md gap-6 px-4 py-14">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl gradient-hero text-primary-foreground">
            <Waves className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">Welcome to Coastal Haven</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to book stays and manage your trips.</p>
        </div>

        <Button variant="outline" onClick={signInWithGoogle} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="signin-email">Email</Label>
              <Input id="signin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button onClick={signIn} disabled={busy || !email || !password}>
              Sign in
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="signup-name">Full name</Label>
              <Input id="signup-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button onClick={signUp} disabled={busy || !email || password.length < 6}>
              Create account
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}