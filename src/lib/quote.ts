// =================================================================
// ORBI LIFE — Fiyat hesaplama (supabase-js, Drizzle yok)
// =================================================================
import { supabase } from "@/lib/supabase";
import { geniusDiscountPercent } from "@/lib/genius";
import { nightsBetween } from "@/lib/format";

export type QuoteResult = {
  ok: boolean; error?: string;
  apartment_id: number; base_price: number; nights: number;
  subtotal: number; genius_percent: number; genius_discount: number;
  coupon_discount: number; coupon_id: number | null; coupon_code: string | null;
  total: number; avg_per_night: number;
};

export async function isAvailable(
  apartmentId: number, checkIn: string, checkOut: string, excludeId?: number
): Promise<boolean> {
  let q = supabase
    .from("reservations")
    .select("id")
    .eq("apartment_id", apartmentId)
    .neq("status", "cancelled")
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.limit(1);
  return !data || data.length === 0;
}

export async function buildQuote(opts: {
  apartment_id: number; check_in: string; check_out: string;
  genius_level?: number; coupon_code?: string | null;
}): Promise<QuoteResult> {
  const empty: QuoteResult = {
    ok: false, apartment_id: opts.apartment_id, base_price: 0, nights: 0,
    subtotal: 0, genius_percent: 0, genius_discount: 0, coupon_discount: 0,
    coupon_id: null, coupon_code: null, total: 0, avg_per_night: 0,
  };

  const nights = nightsBetween(opts.check_in, opts.check_out);
  if (nights <= 0) return { ...empty, error: "Geçersiz tarih aralığı" };

  const { data: apt } = await supabase
    .from("apartments").select("base_price").eq("id", opts.apartment_id).single();
  if (!apt) return { ...empty, error: "Daire bulunamadı" };

  const basePrice = Number(apt.base_price);
  const subtotal  = Math.round(basePrice * nights * 100) / 100;

  const geniusPercent   = geniusDiscountPercent(opts.genius_level ?? 0);
  const geniusDiscount  = Math.round(subtotal * (geniusPercent / 100) * 100) / 100;

  let couponDiscount = 0, couponId: number | null = null, couponCode: string | null = null;
  if (opts.coupon_code) {
    const code = opts.coupon_code.trim().toUpperCase();
    const { data: c } = await supabase
      .from("coupons").select("*").eq("code", code).single();
    const today = new Date();
    if (
      c && c.active && c.used_count < c.max_uses && nights >= c.min_nights &&
      (!c.valid_from || new Date(c.valid_from) <= today) &&
      (!c.valid_to   || new Date(c.valid_to)   >= today)
    ) {
      const base = subtotal - geniusDiscount;
      couponDiscount = c.discount_type === "percent"
        ? Math.round(base * (Number(c.discount_value) / 100) * 100) / 100
        : Math.min(base, Number(c.discount_value));
      couponId = c.id; couponCode = c.code;
    }
  }

  const total = Math.max(0, Math.round((subtotal - geniusDiscount - couponDiscount) * 100) / 100);
  return {
    ok: true, apartment_id: opts.apartment_id, base_price: basePrice,
    nights, subtotal, genius_percent: geniusPercent, genius_discount: geniusDiscount,
    coupon_discount: couponDiscount, coupon_id: couponId, coupon_code: couponCode,
    total, avg_per_night: Math.round((subtotal / nights) * 100) / 100,
  };
}

export function generateReference(): string {
  return `ORL-${Math.floor(100000 + Math.random() * 900000)}`;
}
