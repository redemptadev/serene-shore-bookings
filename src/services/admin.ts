import { supabase } from "@/integrations/supabase/client";
import { deleteStorageObject, PROPERTY_BUCKET } from "@/services/images";
import type { Database } from "@/integrations/supabase/types";

type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];
type PricingRuleInsert = Database["public"]["Tables"]["pricing_rules"]["Insert"];
type BlockInsert = Database["public"]["Tables"]["availability_blocks"]["Insert"];

export async function createProperty(input: PropertyInsert) {
  const { data, error } = await supabase.from("properties").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateProperty(id: string, patch: PropertyUpdate) {
  const { data, error } = await supabase.from("properties").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteProperty(id: string) {
  const { data: images } = await supabase.from("property_images").select("storage_path").eq("property_id", id);
  await Promise.all((images ?? []).map((image) => deleteStorageObject(PROPERTY_BUCKET, image.storage_path)));
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}

export async function listPropertyImages(propertyId: string) {
  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false })
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function addPropertyImage(input: {
  propertyId: string;
  storagePath?: string | null;
  url?: string | null;
  altText?: string | null;
  isCover?: boolean;
  sortOrder?: number;
}) {
  const { error } = await supabase.from("property_images").insert({
    property_id: input.propertyId,
    storage_path: input.storagePath ?? null,
    url: input.url ?? input.storagePath ?? "",
    alt_text: input.altText ?? null,
    is_cover: input.isCover ?? false,
    sort_order: input.sortOrder ?? 0,
  });
  if (error) throw error;
}

export async function setCoverImage(propertyId: string, imageId: string) {
  await supabase.from("property_images").update({ is_cover: false }).eq("property_id", propertyId);
  const { error } = await supabase.from("property_images").update({ is_cover: true }).eq("id", imageId);
  if (error) throw error;
}

export async function removePropertyImage(imageId: string, storagePath?: string | null) {
  await deleteStorageObject(PROPERTY_BUCKET, storagePath);
  const { error } = await supabase.from("property_images").delete().eq("id", imageId);
  if (error) throw error;
}

export async function createPricingRule(input: PricingRuleInsert) {
  const { error } = await supabase.from("pricing_rules").insert(input);
  if (error) throw error;
}

export async function deletePricingRule(id: string) {
  const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
  if (error) throw error;
}

export async function createBlock(input: BlockInsert) {
  const { error } = await supabase.from("availability_blocks").insert(input);
  if (error) throw error;
}

export async function deleteBlock(id: string) {
  const { error } = await supabase.from("availability_blocks").delete().eq("id", id);
  if (error) throw error;
}

export async function updateBookingStatus(
  id: string,
  patch: { booking_status?: Database["public"]["Enums"]["booking_status"]; payment_status?: Database["public"]["Enums"]["payment_status"] },
) {
  const { error } = await supabase.from("bookings").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBooking(id: string) {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw error;
}