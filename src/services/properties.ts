import { supabase } from "@/integrations/supabase/client";
import type { PricingRule, PropertyListItem, PropertyWithImages, SearchFilters } from "@/types";

const SELECT = "*, property_images(*)";

function sortImages<T extends PropertyWithImages>(property: T): T {
  property.property_images = [...(property.property_images ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );
  return property;
}

async function attachRatings(properties: PropertyWithImages[]): Promise<PropertyListItem[]> {
  if (properties.length === 0) return [];
  const { data: reviews } = await supabase
    .from("reviews")
    .select("property_id, rating")
    .in("property_id", properties.map((property) => property.id))
    .eq("is_hidden", false);

  return properties.map((property) => {
    const own = (reviews ?? []).filter((review) => review.property_id === property.id);
    const count = own.length;
    const average = count ? own.reduce((sum, review) => sum + review.rating, 0) / count : null;
    return { ...sortImages(property), rating_average: average, rating_count: count };
  });
}

export async function listPublishedProperties(filters: SearchFilters = {}): Promise<PropertyListItem[]> {
  let query = supabase.from("properties").select(SELECT).eq("status", "published");
  if (filters.guests) query = query.gte("max_guests", filters.guests);
  if (filters.minPrice != null) query = query.gte("base_price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("base_price", filters.maxPrice);
  if (filters.query) query = query.or(`name.ilike.%${filters.query}%,location.ilike.%${filters.query}%`);

  const { data, error } = await query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  let properties = await attachRatings((data ?? []) as PropertyWithImages[]);

  if (filters.checkIn && filters.checkOut && filters.checkOut > filters.checkIn) {
    const availability = await Promise.all(
      properties.map(async (property) => {
        const { data: available } = await supabase.rpc("is_range_available", {
          _property_id: property.id,
          _check_in: filters.checkIn!,
          _check_out: filters.checkOut!,
        });
        return available === true;
      }),
    );
    properties = properties.filter((_, index) => availability[index]);
  }
  return properties;
}

export async function listFeaturedProperties(limit = 6): Promise<PropertyListItem[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(SELECT)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachRatings((data ?? []) as PropertyWithImages[]);
}

export async function getPropertyBySlug(slug: string): Promise<PropertyListItem | null> {
  const { data, error } = await supabase.from("properties").select(SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withRating] = await attachRatings([data as PropertyWithImages]);
  return withRating ?? null;
}

export async function getPropertyById(id: string): Promise<PropertyWithImages | null> {
  const { data, error } = await supabase.from("properties").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? sortImages(data as PropertyWithImages) : null;
}

export async function listAllProperties(): Promise<PropertyListItem[]> {
  const { data, error } = await supabase.from("properties").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return attachRatings((data ?? []) as PropertyWithImages[]);
}

export async function listPricingRules(propertyId: string): Promise<PricingRule[]> {
  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("property_id", propertyId)
    .order("start_date");
  if (error) throw error;
  return data ?? [];
}

export async function listBlocks(propertyId: string) {
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .eq("property_id", propertyId)
    .order("start_date");
  if (error) throw error;
  return data ?? [];
}

export async function listBookedRanges(propertyId: string) {
  const { data, error } = await supabase.rpc("property_booked_ranges", { _property_id: propertyId });
  if (error) throw error;
  return data ?? [];
}

export async function checkAvailability(propertyId: string, checkIn: string, checkOut: string) {
  const { data, error } = await supabase.rpc("is_range_available", {
    _property_id: propertyId,
    _check_in: checkIn,
    _check_out: checkOut,
  });
  if (error) throw error;
  return data === true;
}
