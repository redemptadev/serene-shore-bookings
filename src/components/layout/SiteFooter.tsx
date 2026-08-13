import { Link } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export function SiteFooter() {
  const { data: settings } = useSettings();
  const whatsapp = (settings?.whatsapp_number ?? "").replace(/[^\d]/g, "");

  return (
    <footer className="mt-20 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{settings?.business_name ?? "Coastal Haven"}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {settings?.business_description ?? "Boutique coastal stays in Kilifi, Kenya."}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">Explore</h3>
          <Link to="/stays" className="block text-muted-foreground hover:text-foreground">
            All stays
          </Link>
          <Link to="/contact" className="block text-muted-foreground hover:text-foreground">
            Contact the host
          </Link>
          <Link to="/dashboard" className="block text-muted-foreground hover:text-foreground">
            My trips
          </Link>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground">Get in touch</h3>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {settings?.location_info ?? "Kilifi, Kenya"}
          </p>
          {settings?.contact_email && (
            <a className="flex items-center gap-2 hover:text-foreground" href={`mailto:${settings.contact_email}`}>
              <Mail className="h-4 w-4" /> {settings.contact_email}
            </a>
          )}
          {settings?.host_phone && (
            <a className="flex items-center gap-2 hover:text-foreground" href={`tel:${settings.host_phone}`}>
              <Phone className="h-4 w-4" /> {settings.host_phone}
            </a>
          )}
          {whatsapp && (
            <a
              className="flex items-center gap-2 hover:text-foreground"
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp the host
            </a>
          )}
        </div>
      </div>
      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings?.business_name ?? "Coastal Haven"}. All rights reserved.
      </div>
    </footer>
  );
}