import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings, updateSettings } from "@/services/settings";
import { getIntegrationStatus } from "@/lib/integrations.functions";
import { THEMES } from "@/lib/theme";
import type { AdminSettings } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Business settings — Coastal Haven host console" },
      { name: "description", content: "Update contact details, policies, currency and the site theme for Coastal Haven." },
      { property: "og:title", content: "Business settings — Coastal Haven" },
      { property: "og:description", content: "Host settings for Coastal Haven." },
    ],
  }),
  component: AdminSettingsPage,
});

const TEXT_FIELDS = [
  ["business_name", "Business name"],
  ["host_name", "Host name"],
  ["host_email", "Host email"],
  ["host_phone", "Host phone"],
  ["whatsapp_number", "WhatsApp number"],
  ["contact_email", "Public contact email"],
  ["location_info", "Location"],
  ["currency", "Currency code"],
  ["instagram_url", "Instagram URL"],
  ["facebook_url", "Facebook URL"],
  ["tiktok_url", "TikTok URL"],
  ["website_url", "Website URL"],
] as const;

const LONG_FIELDS = [
  ["business_description", "Business description"],
  ["check_in_instructions", "Check-in instructions"],
  ["check_out_instructions", "Check-out instructions"],
  ["booking_policy", "Booking policy"],
  ["cancellation_policy", "Cancellation policy"],
  ["payment_instructions", "Payment instructions"],
] as const;

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: getSettings });
  const { data: integrations } = useQuery({ queryKey: ["integrations"], queryFn: () => getIntegrationStatus() });
  const [form, setForm] = useState<Partial<AdminSettings>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const save = useMutation({
    mutationFn: () => {
      const { id: _id, updated_at: _updated, ...patch } = form as AdminSettings;
      return updateSettings(patch);
    },
    onSuccess: () => {
      toast.success("Settings saved.");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: () => toast.error("Could not save settings."),
  });

  if (isLoading) {
    return (
      <AdminShell title="Settings">
        <Skeleton className="h-64 w-full rounded-xl" />
      </AdminShell>
    );
  }

  const value = (key: keyof AdminSettings) => (form[key] as string | null) ?? "";

  return (
    <AdminShell title="Settings" description="Contact details, policies, currency and site theme.">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business &amp; contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {TEXT_FIELDS.map(([key, label]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={value(key)}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policies &amp; guest info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {LONG_FIELDS.map(([key, label]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Textarea
                  id={key}
                  rows={3}
                  value={value(key)}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Site theme</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setForm((current) => ({ ...current, theme: theme.id }))}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  form.theme === theme.id ? "border-primary ring-2 ring-primary/40" : "hover:bg-muted"
                }`}
              >
                <span className="mb-2 flex gap-1">
                  {theme.swatches.map((swatch) => (
                    <span key={swatch} className="h-5 w-5 rounded-full border" style={{ backgroundColor: swatch }} />
                  ))}
                </span>
                {theme.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {(integrations?.integrations ?? []).map((integration) => (
              <div key={integration.id} className="flex items-center justify-between rounded-lg border p-3">
                <span>
                  <strong>{integration.label}</strong>
                  <span className="text-muted-foreground"> · {integration.description}</span>
                </span>
                <span className={integration.configured ? "text-primary" : "text-muted-foreground"}>
                  {integration.configured ? "Connected" : "Not configured"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}