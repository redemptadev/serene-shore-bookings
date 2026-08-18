import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Star, Trash2, Upload } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyImage } from "@/components/PropertyImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyById, listPricingRules } from "@/services/properties";
import {
  addPropertyImage,
  createPricingRule,
  deletePricingRule,
  removePropertyImage,
  setCoverImage,
  updateProperty,
} from "@/services/admin";
import { uploadPropertyImage } from "@/services/images";
import { formatDate, formatMoney, slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/properties/$id")({
  head: () => ({
    meta: [
      { title: "Edit listing — Coastal Haven host console" },
      { name: "description", content: "Edit stay details, photos, pricing rules and availability settings." },
      { property: "og:title", content: "Edit listing — Coastal Haven" },
      { property: "og:description", content: "Host tools for editing a Coastal Haven stay." },
    ],
  }),
  component: EditProperty,
});

function EditProperty() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: property, isLoading } = useQuery({ queryKey: ["admin-property", id], queryFn: () => getPropertyById(id) });
  const { data: rules } = useQuery({ queryKey: ["pricing-rules", id], queryFn: () => listPricingRules(id) });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    location: "",
    description: "",
    property_type: "villa",
    base_price: "0",
    weekend_price: "",
    cleaning_fee: "0",
    min_nights: "1",
    max_guests: "2",
    bedrooms: "1",
    beds: "1",
    bathrooms: "1",
    check_in_time: "14:00",
    check_out_time: "10:00",
    amenities: "",
    house_rules: "",
    map_url: "",
  });

  useEffect(() => {
    if (!property) return;
    setForm({
      name: property.name,
      slug: property.slug,
      location: property.location,
      description: property.description,
      property_type: property.property_type,
      base_price: String(property.base_price),
      weekend_price: property.weekend_price == null ? "" : String(property.weekend_price),
      cleaning_fee: String(property.cleaning_fee),
      min_nights: String(property.min_nights),
      max_guests: String(property.max_guests),
      bedrooms: String(property.bedrooms),
      beds: String(property.beds),
      bathrooms: String(property.bathrooms),
      check_in_time: property.check_in_time,
      check_out_time: property.check_out_time,
      amenities: property.amenities.join(", "),
      house_rules: property.house_rules.join("\n"),
      map_url: property.map_url ?? "",
    });
  }, [property]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-property", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
  };

  const save = useMutation({
    mutationFn: () =>
      updateProperty(id, {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        location: form.location.trim(),
        description: form.description.trim(),
        property_type: form.property_type.trim() || "villa",
        base_price: Number(form.base_price) || 0,
        weekend_price: form.weekend_price === "" ? null : Number(form.weekend_price),
        cleaning_fee: Number(form.cleaning_fee) || 0,
        min_nights: Math.max(1, Number(form.min_nights) || 1),
        max_guests: Math.max(1, Number(form.max_guests) || 1),
        bedrooms: Number(form.bedrooms) || 1,
        beds: Number(form.beds) || 1,
        bathrooms: Number(form.bathrooms) || 1,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
        house_rules: form.house_rules.split("\n").map((item) => item.trim()).filter(Boolean),
        map_url: form.map_url.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Listing saved.");
      invalidate();
    },
    onError: () => toast.error("Could not save the listing."),
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const existing = property?.property_images?.length ?? 0;
      let index = 0;
      for (const file of Array.from(files)) {
        const path = await uploadPropertyImage(file);
        await addPropertyImage({
          propertyId: id,
          storagePath: path,
          url: path,
          altText: form.name,
          isCover: existing === 0 && index === 0,
          sortOrder: existing + index,
        });
        index += 1;
      }
    },
    onSuccess: () => {
      toast.success("Photos uploaded.");
      invalidate();
    },
    onError: () => toast.error("Photo upload failed."),
  });

  const cover = useMutation({
    mutationFn: (imageId: string) => setCoverImage(id, imageId),
    onSuccess: invalidate,
  });

  const removeImage = useMutation({
    mutationFn: ({ imageId, path }: { imageId: string; path: string | null }) => removePropertyImage(imageId, path),
    onSuccess: invalidate,
  });

  const [rule, setRule] = useState({ label: "High season", start: "", end: "", price: "", discount: "" });
  const addRule = useMutation({
    mutationFn: () =>
      createPricingRule({
        property_id: id,
        label: rule.label.trim() || "Season",
        start_date: rule.start,
        end_date: rule.end,
        nightly_price: rule.price === "" ? null : Number(rule.price),
        discount_percent: rule.discount === "" ? null : Number(rule.discount),
      }),
    onSuccess: () => {
      toast.success("Pricing rule added.");
      setRule({ label: "High season", start: "", end: "", price: "", discount: "" });
      queryClient.invalidateQueries({ queryKey: ["pricing-rules", id] });
    },
    onError: () => toast.error("Could not add the pricing rule."),
  });
  const removeRule = useMutation({
    mutationFn: (ruleId: string) => deletePricingRule(ruleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pricing-rules", id] }),
  });

  if (isLoading) {
    return (
      <AdminShell title="Edit listing">
        <Skeleton className="h-64 w-full rounded-xl" />
      </AdminShell>
    );
  }

  if (!property) {
    return (
      <AdminShell title="Edit listing">
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">This listing no longer exists.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={property.name} description="Stay details, photos and seasonal pricing.">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin/properties">
          <ArrowLeft className="mr-2 h-4 w-4" /> All listings
        </Link>
      </Button>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Stay details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["name", "Name", "text"],
                ["slug", "URL slug", "text"],
                ["location", "Location", "text"],
                ["property_type", "Property type", "text"],
                ["base_price", "Base nightly price", "number"],
                ["weekend_price", "Weekend price (optional)", "number"],
                ["cleaning_fee", "Cleaning fee", "number"],
                ["min_nights", "Minimum nights", "number"],
                ["max_guests", "Max guests", "number"],
                ["bedrooms", "Bedrooms", "number"],
                ["beds", "Beds", "number"],
                ["bathrooms", "Bathrooms", "number"],
                ["check_in_time", "Check-in time", "time"],
                ["check_out_time", "Check-out time", "time"],
                ["map_url", "Map link (optional)", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={type}
                  value={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </div>
            ))}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="amenities">Amenities (comma separated)</Label>
              <Textarea
                id="amenities"
                rows={3}
                value={form.amenities}
                onChange={(event) => setForm((current) => ({ ...current, amenities: event.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="house_rules">House rules (one per line)</Label>
              <Textarea
                id="house_rules"
                rows={3}
                value={form.house_rules}
                onChange={(event) => setForm((current) => ({ ...current, house_rules: event.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <Upload className="h-4 w-4" />
              {upload.isPending ? "Uploading…" : "Upload photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.length) upload.mutate(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {(property.property_images ?? []).map((image) => (
                <div key={image.id} className="overflow-hidden rounded-xl border">
                  <PropertyImage image={image} alt={image.alt_text ?? property.name} className="h-40 w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <Button variant="ghost" size="sm" onClick={() => cover.mutate(image.id)}>
                      <Star className={`mr-1 h-4 w-4 ${image.is_cover ? "fill-current" : ""}`} />
                      {image.is_cover ? "Cover" : "Make cover"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage.mutate({ imageId: image.id, path: image.storage_path })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seasonal pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-5">
              <Input value={rule.label} onChange={(event) => setRule({ ...rule, label: event.target.value })} placeholder="Label" />
              <Input type="date" value={rule.start} onChange={(event) => setRule({ ...rule, start: event.target.value })} />
              <Input type="date" value={rule.end} onChange={(event) => setRule({ ...rule, end: event.target.value })} />
              <Input
                type="number"
                value={rule.price}
                onChange={(event) => setRule({ ...rule, price: event.target.value })}
                placeholder="Nightly price"
              />
              <Input
                type="number"
                value={rule.discount}
                onChange={(event) => setRule({ ...rule, discount: event.target.value })}
                placeholder="% off"
              />
            </div>
            <Button onClick={() => addRule.mutate()} disabled={!rule.start || !rule.end || addRule.isPending}>
              Add pricing rule
            </Button>
            <div className="grid gap-2">
              {(rules ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>
                    <strong>{item.label}</strong> · {formatDate(item.start_date)} → {formatDate(item.end_date)} ·{" "}
                    {item.nightly_price != null ? formatMoney(Number(item.nightly_price)) : `${item.discount_percent}% off`}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => removeRule.mutate(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}