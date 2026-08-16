import { supabase } from "@/integrations/supabase/client";

const SELECT = "*, properties(id, name, slug, location, check_in_time, check_out_time, property_images(url, storage_path, alt_text, is_cover, sort_order))";

export async function listMyBookings(userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(SELECT)
    .eq("user_id", userId)
    .order("check_in", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBooking(id: string) {
  const { data, error } = await supabase.from("bookings").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listAllBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select(`${SELECT}, payments(*)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPropertyBookings(propertyId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("property_id", propertyId)
    .order("check_in");
  if (error) throw error;
  return data ?? [];
}

export async function listPayments(bookingId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
