import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"];
export type PricingRule = Database["public"]["Tables"]["pricing_rules"]["Row"];
export type AvailabilityBlock = Database["public"]["Tables"]["availability_blocks"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AdminSettings = Database["public"]["Tables"]["admin_settings"]["Row"];

export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

export interface ExtraFee {
  label: string;
  amount: number;
}

export interface PropertyWithImages extends Property {
  property_images: PropertyImage[];
}

export interface PropertyListItem extends PropertyWithImages {
  rating_average: number | null;
  rating_count: number;
}

export interface Quote {
  nights: number;
  nightlyBreakdown: { date: string; price: number }[];
  subtotal: number;
  cleaningFee: number;
  extraFees: ExtraFee[];
  fees: number;
  total: number;
  currency: string;
}

export interface SearchFilters {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
}
