import { supabase } from "@/integrations/supabase/client";
import type { Notification, Review } from "@/types";

export async function listFavorites(userId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select("*, properties(*, property_images(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function toggleFavorite(userId: string, propertyId: string, isFavorite: boolean) {
  if (isFavorite) {
    const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("property_id", propertyId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("favorites").insert({ user_id: userId, property_id: propertyId });
  if (error) throw error;
  return true;
}

export async function listPropertyReviews(propertyId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("property_id", propertyId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listMyReviews(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, properties(name, slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}

export async function listAllReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, properties(name, slug)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function submitReview(input: {
  propertyId: string;
  userId: string;
  bookingId?: string | null;
  rating: number;
  comment: string;
  authorName?: string | null;
}) {
  const { error } = await supabase.from("reviews").insert({
    property_id: input.propertyId,
    user_id: input.userId,
    booking_id: input.bookingId ?? null,
    rating: input.rating,
    comment: input.comment,
    author_name: input.authorName ?? null,
  });
  if (error) throw error;
}

export async function setReviewHidden(id: string, hidden: boolean) {
  const { error } = await supabase.from("reviews").update({ is_hidden: hidden }).eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

export async function listNotifications(scope: "user" | "admin", userId?: string): Promise<Notification[]> {
  let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  query = scope === "admin" ? query.eq("audience", "admin") : query.eq("user_id", userId ?? "");
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}
