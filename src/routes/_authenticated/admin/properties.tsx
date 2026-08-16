import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Star, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyImage } from "@/components/PropertyImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listAllProperties } from "@/services/properties";
import { createProperty, deleteProperty, updateProperty } from "@/services/admin";
import { formatMoney, slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/properties")({
  head: () => ({
    meta: [
      { title: "Listings manager — Coastal Haven host console" },
      { name: "description", content: "Create, publish and manage your Coastal Haven stays, photos and nightly rates." },
      { property: "og:title", content: "Listings manager — Coastal Haven" },
      { property: "og:description", content: "Host tools for managing Coastal Haven listings." },
    ],
  }),
  component: AdminProperties,
});

function AdminProperties() {
  const queryClient = useQueryClient();
  const { data: properties, isLoading } = useQuery({ queryKey: ["admin-properties"], queryFn: listAllProperties });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("10000");
  const [guests, setGuests] = useState("2");
  const [description, setDescription] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-properties"] });

  const create = useMutation({
    mutationFn: () =>
      createProperty({
        name: name.trim(),
        slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
        location: location.trim(),
        description: description.trim(),
        base_price: Number(price) || 0,
        max_guests: Number(guests) || 2,
        status: "draft",
      }),
    onSuccess: () => {
      toast.success("Listing created as a draft — add photos, then publish.");
      setOpen(false);
      setName("");
      setLocation("");
      setDescription("");
      invalidate();
    },
    onError: () => toast.error("Could not create the listing."),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) => updateProperty(id, { status }),
    onSuccess: () => {
      toast.success("Listing updated.");
      invalidate();
    },
    onError: () => toast.error("Could not update the listing."),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => updateProperty(id, { is_featured: featured }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      toast.success("Listing deleted.");
      invalidate();
    },
    onError: () => toast.error("Could not delete the listing."),
  });

  return (
    <AdminShell title="Listings" description="Add stays, manage photos and control what guests can book.">
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setOpen((value) => !value)}>
          <Plus className="mr-2 h-4 w-4" /> New listing
        </Button>
      </div>

      {open && (
        <Card className="mb-8">
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="p-name">Listing name</Label>
              <Input id="p-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ocean Breeze Villa" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-location">Location</Label>
              <Input id="p-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Kilifi, Kenya" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-price">Base nightly price</Label>
              <Input id="p-price" type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-guests">Max guests</Label>
              <Input id="p-guests" type="number" min={1} value={guests} onChange={(event) => setGuests(event.target.value)} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={() => create.mutate()} disabled={name.trim().length < 3 || create.isPending}>
                {create.isPending ? "Creating…" : "Create draft listing"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : (properties ?? []).length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">No listings yet. Create your first stay above.</p>
      ) : (
        <div className="grid gap-4">
          {(properties ?? []).map((property) => {
            const cover = property.property_images?.[0] ?? null;
            return (
              <Card key={property.id}>
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {cover && <PropertyImage image={cover} alt={property.name} className="h-24 w-32 object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold">{property.name}</h2>
                      <Badge variant={property.status === "published" ? "default" : "secondary"}>{property.status}</Badge>
                      {property.is_featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {property.location} · {formatMoney(Number(property.base_price))} / night · up to {property.max_guests} guests
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/admin/properties/$id" params={{ id: property.id }}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleStatus.mutate({ id: property.id, status: property.status === "published" ? "draft" : "published" })
                      }
                    >
                      {property.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatured.mutate({ id: property.id, featured: !property.is_featured })}
                    >
                      <Star className={`h-4 w-4 ${property.is_featured ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Delete ${property.name}? This cannot be undone.`)) remove.mutate(property.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}