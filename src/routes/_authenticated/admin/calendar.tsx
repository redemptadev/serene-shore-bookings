import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listAllProperties, listBlocks, listBookedRanges } from "@/services/properties";
import { createBlock, deleteBlock } from "@/services/admin";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/calendar")({
  head: () => ({
    meta: [
      { title: "Availability calendar — Coastal Haven host console" },
      { name: "description", content: "Block dates for maintenance or private use and see every booked range per stay." },
      { property: "og:title", content: "Availability calendar — Coastal Haven" },
      { property: "og:description", content: "Host tools for Coastal Haven availability." },
    ],
  }),
  component: AdminCalendar,
});

function AdminCalendar() {
  const queryClient = useQueryClient();
  const { data: properties, isLoading } = useQuery({ queryKey: ["admin-properties"], queryFn: listAllProperties });
  const [selected, setSelected] = useState<string | null>(null);
  const propertyId = selected ?? properties?.[0]?.id ?? null;

  const { data: blocks } = useQuery({
    queryKey: ["blocks", propertyId],
    queryFn: () => listBlocks(propertyId!),
    enabled: !!propertyId,
  });
  const { data: booked } = useQuery({
    queryKey: ["booked-ranges", propertyId],
    queryFn: () => listBookedRanges(propertyId!),
    enabled: !!propertyId,
  });

  const [range, setRange] = useState({ start: "", end: "", reason: "" });

  const add = useMutation({
    mutationFn: () =>
      createBlock({
        property_id: propertyId!,
        start_date: range.start,
        end_date: range.end,
        reason: range.reason.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Dates blocked.");
      setRange({ start: "", end: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["blocks", propertyId] });
    },
    onError: () => toast.error("Could not block those dates."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBlock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocks", propertyId] }),
  });

  if (isLoading) {
    return (
      <AdminShell title="Calendar">
        <Skeleton className="h-48 w-full rounded-xl" />
      </AdminShell>
    );
  }

  if (!propertyId) {
    return (
      <AdminShell title="Calendar">
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">Add a listing first to manage availability.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Calendar" description="Block dates and review confirmed stays for each listing.">
      <div className="mb-6 flex flex-wrap gap-2">
        {(properties ?? []).map((property) => (
          <Button
            key={property.id}
            size="sm"
            variant={property.id === propertyId ? "default" : "outline"}
            onClick={() => setSelected(property.id)}
          >
            {property.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Block dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="block-start">From</Label>
                <Input id="block-start" type="date" value={range.start} onChange={(event) => setRange({ ...range, start: event.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="block-end">To (exclusive)</Label>
                <Input id="block-end" type="date" value={range.end} onChange={(event) => setRange({ ...range, end: event.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="block-reason">Reason (optional)</Label>
              <Input id="block-reason" value={range.reason} onChange={(event) => setRange({ ...range, reason: event.target.value })} />
            </div>
            <Button onClick={() => add.mutate()} disabled={!range.start || !range.end || add.isPending}>
              {add.isPending ? "Blocking…" : "Block these dates"}
            </Button>

            <div className="grid gap-2">
              {(blocks ?? []).map((block) => (
                <div key={block.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>
                    {formatDate(block.start_date)} → {formatDate(block.end_date)}
                    {block.reason ? ` · ${block.reason}` : ""}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(block.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(blocks ?? []).length === 0 && <p className="text-sm text-muted-foreground">No blocked dates.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booked dates</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(booked ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No active bookings for this listing.</p>
            ) : (
              (booked ?? []).map((row) => (
                <div key={`${row.check_in}-${row.check_out}`} className="rounded-lg border p-3 text-sm">
                  {formatDate(row.check_in)} → {formatDate(row.check_out)}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}