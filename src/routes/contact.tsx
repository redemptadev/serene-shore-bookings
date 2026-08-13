import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact the host — Coastal Haven Kilifi" },
      {
        name: "description",
        content: "Reach the Coastal Haven host by email, phone or WhatsApp for bookings, long stays and arrival details.",
      },
      { property: "og:title", content: "Contact the host — Coastal Haven" },
      { property: "og:description", content: "Email, call or WhatsApp the Coastal Haven host in Kilifi, Kenya." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data: settings } = useSettings();
  const whatsapp = (settings?.whatsapp_number ?? "").replace(/[^\d]/g, "");

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-semibold">Talk to your host</h1>
        <p className="mt-2 text-muted-foreground">
          Questions about a stay, long-term rates or arrival logistics? We usually reply within a few hours.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-semibold">Email</h2>
            <a
              className="text-sm text-muted-foreground hover:text-foreground"
              href={`mailto:${settings?.contact_email ?? "coastalhavenbnb@outlook.com"}`}
            >
              {settings?.contact_email ?? "coastalhavenbnb@outlook.com"}
            </a>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-semibold">Phone</h2>
            <p className="text-sm text-muted-foreground">{settings?.host_phone || "Available on request"}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-semibold">Where we are</h2>
            <p className="text-sm text-muted-foreground">{settings?.location_info ?? "Kilifi, Kenya"}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-semibold">WhatsApp</h2>
            <p className="text-sm text-muted-foreground">Fastest way to reach the host.</p>
            {whatsapp && (
              <Button asChild size="sm" className="mt-3">
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                  Start a chat
                </a>
              </Button>
            )}
          </div>
        </div>

        {(settings?.check_in_instructions || settings?.cancellation_policy || settings?.booking_policy) && (
          <div className="mt-10 space-y-6">
            {settings?.booking_policy && (
              <section>
                <h2 className="text-xl font-semibold">Booking policy</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{settings.booking_policy}</p>
              </section>
            )}
            {settings?.cancellation_policy && (
              <section>
                <h2 className="text-xl font-semibold">Cancellation policy</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{settings.cancellation_policy}</p>
              </section>
            )}
            {settings?.check_in_instructions && (
              <section>
                <h2 className="text-xl font-semibold">Arrival</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{settings.check_in_instructions}</p>
              </section>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}