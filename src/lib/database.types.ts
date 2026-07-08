// =================================================================
// ORBI LIFE — Supabase veritabanı tip tanımları
// Tablo adları migration.sql ile birebir eşleşir.
// =================================================================
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; phone: string; role: string; genius_level: number; total_reservations: number; created_at: string };
        Insert: { id: string; full_name?: string; phone?: string; role?: string; genius_level?: number; total_reservations?: number };
        Update: { full_name?: string; phone?: string; role?: string; genius_level?: number; total_reservations?: number };
      };
      blocks: {
        Row: { id: number; code: string; name: string; description: string; floors: number };
        Insert: { code: string; name: string; description?: string; floors?: number };
        Update: { name?: string; description?: string; floors?: number };
      };
      apartment_types: {
        Row: { id: number; code: string; name: string; bedrooms: number; bathrooms: number; max_guests: number };
        Insert: { code: string; name: string; bedrooms?: number; bathrooms?: number; max_guests?: number };
        Update: { name?: string; bedrooms?: number; bathrooms?: number; max_guests?: number };
      };
      apartments: {
        Row: { id: number; code: string; name: string; block_id: number; type_id: number; floor: number; description: string; rules: string; base_price: number; max_guests: number; bedrooms: number; bathrooms: number; size_sqm: number; sea_view: boolean; balcony: boolean; cover_image: string; video_url: string; tour_360_url: string; rating: number; review_count: number; status: string; created_at: string };
        Insert: { code: string; name: string; block_id: number; type_id: number; floor?: number; description?: string; rules?: string; base_price?: number; max_guests?: number; bedrooms?: number; bathrooms?: number; size_sqm?: number; sea_view?: boolean; balcony?: boolean; cover_image?: string; video_url?: string; tour_360_url?: string; status?: string };
        Update: { name?: string; floor?: number; description?: string; rules?: string; base_price?: number; max_guests?: number; bedrooms?: number; bathrooms?: number; size_sqm?: number; sea_view?: boolean; balcony?: boolean; cover_image?: string; video_url?: string; tour_360_url?: string; rating?: number; review_count?: number; status?: string };
      };
      apartment_images: {
        Row: { id: number; apartment_id: number; url: string; sort_order: number };
        Insert: { apartment_id: number; url: string; sort_order?: number };
        Update: { url?: string; sort_order?: number };
      };
      apartment_videos: {
        Row: { id: number; apartment_id: number; url: string; title: string; sort_order: number };
        Insert: { apartment_id: number; url: string; title?: string; sort_order?: number };
        Update: { url?: string; title?: string; sort_order?: number };
      };
      amenities: {
        Row: { id: number; name: string; icon: string; category: string };
        Insert: { name: string; icon?: string; category?: string };
        Update: { name?: string; icon?: string; category?: string };
      };
      apartment_amenities: {
        Row: { apartment_id: number; amenity_id: number };
        Insert: { apartment_id: number; amenity_id: number };
        Update: never;
      };
      facilities: {
        Row: { id: number; name: string; description: string; icon: string; hours: string; active: boolean; sort_order: number };
        Insert: { name: string; description?: string; icon?: string; hours?: string; active?: boolean; sort_order?: number };
        Update: { name?: string; description?: string; icon?: string; hours?: string; active?: boolean; sort_order?: number };
      };
      coupons: {
        Row: { id: number; code: string; discount_type: string; discount_value: number; min_nights: number; valid_from: string | null; valid_to: string | null; max_uses: number; used_count: number; active: boolean };
        Insert: { code: string; discount_type?: string; discount_value?: number; min_nights?: number; valid_from?: string | null; valid_to?: string | null; max_uses?: number; active?: boolean };
        Update: { discount_type?: string; discount_value?: number; min_nights?: number; valid_from?: string | null; valid_to?: string | null; max_uses?: number; active?: boolean };
      };
      reservations: {
        Row: { id: number; reference: string; apartment_id: number; user_id: string | null; check_in: string; check_out: string; nights: number; guests: number; base_price: number; subtotal: number; genius_discount: number; coupon_discount: number; total_price: number; coupon_id: number | null; guest_name: string; guest_email: string; guest_phone: string; note: string; status: string; payment_status: string; created_at: string };
        Insert: { reference: string; apartment_id: number; user_id?: string | null; check_in: string; check_out: string; nights?: number; guests?: number; base_price?: number; subtotal?: number; genius_discount?: number; coupon_discount?: number; total_price?: number; coupon_id?: number | null; guest_name?: string; guest_email?: string; guest_phone?: string; note?: string; status?: string; payment_status?: string };
        Update: { status?: string; payment_status?: string; note?: string };
      };
      loyalty_levels: {
        Row: { id: number; level: number; name: string; min_reservations: number; discount_percent: number; perks: string };
        Insert: { level: number; name: string; min_reservations?: number; discount_percent?: number; perks?: string };
        Update: { name?: string; min_reservations?: number; discount_percent?: number; perks?: string };
      };
      cash_transactions: {
        Row: { id: number; reservation_id: number | null; guest_name: string; apartment_code: string; amount: number; payment_type: string; note: string; paid_at: string; created_at: string };
        Insert: { reservation_id?: number | null; guest_name?: string; apartment_code?: string; amount: number; payment_type?: string; note?: string; paid_at?: string };
        Update: { amount?: number; payment_type?: string; note?: string; paid_at?: string };
      };
      settings: {
        Row: { id: number; site_name: string; site_url: string; contact_email: string; contact_phone: string; check_in_time: string; check_out_time: string; currency: string; updated_at: string };
        Insert: { site_name?: string; site_url?: string; contact_email?: string; contact_phone?: string; check_in_time?: string; check_out_time?: string; currency?: string };
        Update: { site_name?: string; site_url?: string; contact_email?: string; contact_phone?: string; check_in_time?: string; check_out_time?: string; currency?: string };
      };
    };
  };
}
