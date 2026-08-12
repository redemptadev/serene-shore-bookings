export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          booking_policy: string
          business_description: string
          business_name: string
          cancellation_policy: string
          check_in_instructions: string
          check_out_instructions: string
          contact_email: string
          currency: string
          facebook_url: string | null
          host_email: string
          host_name: string
          host_phone: string
          id: boolean
          instagram_url: string | null
          location_info: string
          payment_instructions: string
          theme: string
          tiktok_url: string | null
          updated_at: string
          website_url: string | null
          whatsapp_number: string
        }
        Insert: {
          booking_policy?: string
          business_description?: string
          business_name?: string
          cancellation_policy?: string
          check_in_instructions?: string
          check_out_instructions?: string
          contact_email?: string
          currency?: string
          facebook_url?: string | null
          host_email?: string
          host_name?: string
          host_phone?: string
          id?: boolean
          instagram_url?: string | null
          location_info?: string
          payment_instructions?: string
          theme?: string
          tiktok_url?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_number?: string
        }
        Update: {
          booking_policy?: string
          business_description?: string
          business_name?: string
          cancellation_policy?: string
          check_in_instructions?: string
          check_out_instructions?: string
          contact_email?: string
          currency?: string
          facebook_url?: string | null
          host_email?: string
          host_name?: string
          host_phone?: string
          id?: boolean
          instagram_url?: string | null
          location_info?: string
          payment_instructions?: string
          theme?: string
          tiktok_url?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      availability_blocks: {
        Row: {
          created_at: string
          end_date: string
          id: string
          property_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          property_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          property_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"]
          check_in: string
          check_out: string
          created_at: string
          created_by_admin: boolean
          currency: string
          fees: number
          guest_email: string
          guest_name: string
          guest_notes: string | null
          guest_phone: string | null
          guests: number
          id: string
          nights: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          property_id: string
          reference: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          check_in: string
          check_out: string
          created_at?: string
          created_by_admin?: boolean
          currency?: string
          fees?: number
          guest_email?: string
          guest_name?: string
          guest_notes?: string | null
          guest_phone?: string | null
          guests?: number
          id?: string
          nights?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          property_id: string
          reference?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          check_in?: string
          check_out?: string
          created_at?: string
          created_by_admin?: boolean
          currency?: string
          fees?: number
          guest_email?: string
          guest_name?: string
          guest_notes?: string | null
          guest_phone?: string | null
          guests?: number
          id?: string
          nights?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          property_id?: string
          reference?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean
          kind: string
          title: string
          user_id: string | null
        }
        Insert: {
          audience?: string
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          title: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          checkout_request_id: string | null
          created_at: string
          currency: string
          id: string
          provider: string
          provider_reference: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          booking_id: string
          checkout_request_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_reference?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          checkout_request_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_reference?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          created_at: string
          discount_percent: number | null
          end_date: string
          id: string
          label: string
          nightly_price: number | null
          property_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          end_date: string
          id?: string
          label?: string
          nightly_price?: number | null
          property_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          end_date?: string
          id?: string
          label?: string
          nightly_price?: number | null
          property_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[]
          base_price: number
          bathrooms: number
          bedrooms: number
          beds: number
          check_in_time: string
          check_out_time: string
          cleaning_fee: number
          created_at: string
          description: string
          extra_fees: Json
          house_rules: string[]
          id: string
          is_featured: boolean
          latitude: number | null
          location: string
          longitude: number | null
          map_url: string | null
          max_guests: number
          min_nights: number
          name: string
          property_type: string
          slug: string
          status: Database["public"]["Enums"]["property_status"]
          updated_at: string
          weekend_price: number | null
        }
        Insert: {
          amenities?: string[]
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          beds?: number
          check_in_time?: string
          check_out_time?: string
          cleaning_fee?: number
          created_at?: string
          description?: string
          extra_fees?: Json
          house_rules?: string[]
          id?: string
          is_featured?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_url?: string | null
          max_guests?: number
          min_nights?: number
          name: string
          property_type?: string
          slug: string
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
          weekend_price?: number | null
        }
        Update: {
          amenities?: string[]
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          beds?: number
          check_in_time?: string
          check_out_time?: string
          cleaning_fee?: number
          created_at?: string
          description?: string
          extra_fees?: Json
          house_rules?: string[]
          id?: string
          is_featured?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_url?: string | null
          max_guests?: number
          min_nights?: number
          name?: string
          property_type?: string
          slug?: string
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
          weekend_price?: number | null
        }
        Relationships: []
      }
      property_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_cover: boolean
          property_id: string
          sort_order: number
          storage_path: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          property_id: string
          sort_order?: number
          storage_path?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          property_id?: string
          sort_order?: number
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string | null
          booking_id: string | null
          comment: string
          created_at: string
          id: string
          is_hidden: boolean
          property_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          booking_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          property_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          booking_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          property_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_range_available: {
        Args: { _check_in: string; _check_out: string; _property_id: string }
        Returns: boolean
      }
      property_booked_ranges: {
        Args: { _property_id: string }
        Returns: {
          check_in: string
          check_out: string
        }[]
      }
      sync_profile: {
        Args: {
          _avatar_url?: string
          _country?: string
          _full_name?: string
          _phone?: string
        }
        Returns: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "user" | "admin"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      property_status: "draft" | "published"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      property_status: ["draft", "published"],
    },
  },
} as const
