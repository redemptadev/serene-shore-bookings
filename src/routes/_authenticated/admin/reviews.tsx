import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteReview, listAllReviews, setReviewHidden } from "@/services/engagement";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Guest reviews — Coastal Haven host console" },
      { name: "description", content: "Moderate guest reviews: hide, restore or remove feedback on your stays." },
      { property: "og:title", content: "Guest reviews — Coastal Haven" },
      { property: "og:description", content: "Host tools for moderating Coastal Haven reviews." },
    ],
  }),
  component: AdminReviews,
});

function AdminReviews() {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useQuery({ queryKey: ["admin-reviews"], queryFn: listAllReviews });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });

  const hide = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) => setReviewHidden(id, hidden),
    onSuccess: () => {
      toast.success("Review updated.");
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      toast.success("Review deleted.");
      invalidate();
    },
  });

  return (
    <AdminShell title="Reviews" description="Everything guests have said about your stays.">
      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (reviews ?? []).length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="grid gap-4">
          {(reviews ?? []).map((review) => (
            <Card key={review.id}>
              <CardContent className="flex flex-col gap-2 pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-0.5 text-primary">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                  <strong>{review.author_name ?? "Guest"}</strong>
                  <span className="text-muted-foreground">
                    · {review.properties?.name ?? "Stay"} · {formatDate(review.created_at)}
                  </span>
                  {review.is_hidden && <span className="text-xs text-destructive">Hidden</span>}
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => hide.mutate({ id: review.id, hidden: !review.is_hidden })}>
                    {review.is_hidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                    {review.is_hidden ? "Show publicly" : "Hide"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm("Delete this review permanently?")) remove.mutate(review.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}