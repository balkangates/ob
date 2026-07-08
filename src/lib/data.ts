// =================================================================
// ORBI LIFE — Veri okuma fonksiyonları (supabase-js)
// Drizzle ORM bağımlılığı tamamen kaldırıldı.
// =================================================================
import { supabase } from "@/lib/supabase";

export type ApartmentListItem = {
  id: number; code: string; name: string;
  block_code: string; type_code: string; type_name: string;
  floor: number; base_price: number; max_guests: number;
  bedrooms: number; bathrooms: number; size_sqm: number;
  sea_view: boolean; balcony: boolean;
  cover_image: string; rating: number; review_count: number;
};

export type SearchFilters = {
  q?: string; block?: string; type?: string;
  guests?: number; min_price?: number; max_price?: number;
  sea_view?: boolean; balcony?: boolean;
  sort?: string; check_in?: string; check_out?: string;
};

export async function getFacets() {
  const [{ data: blocks }, { data: types }] = await Promise.all([
    supabase.from("blocks").select("id, code, name, description").order("code"),
    supabase.from("apartment_types").select("id, code, name").order("id"),
  ]);
  return { blocks: blocks ?? [], types: types ?? [] };
}

export async function searchApartments(f: SearchFilters): Promise<ApartmentListItem[]> {
  let query = supabase
    .from("apartments")
    .select(`
      id, code, name, floor, base_price, max_guests,
      bedrooms, bathrooms, size_sqm, sea_view, balcony,
      cover_image, rating, review_count,
      blocks!inner(code),
      apartment_types!inner(code, name)
    `)
    .eq("status", "active");

  if (f.block)      query = query.eq("blocks.code", f.block);
  if (f.type)       query = query.eq("apartment_types.code", f.type);
  if (f.guests)     query = query.gte("max_guests", f.guests);
  if (f.min_price)  query = query.gte("base_price", f.min_price);
  if (f.max_price)  query = query.lte("base_price", f.max_price);
  if (f.sea_view)   query = query.eq("sea_view", true);
  if (f.balcony)    query = query.eq("balcony", true);
  if (f.q)          query = query.or(`name.ilike.%${f.q}%,code.ilike.%${f.q}%`);

  switch (f.sort) {
    case "price_asc":  query = query.order("base_price", { ascending: true });  break;
    case "price_desc": query = query.order("base_price", { ascending: false }); break;
    case "rating":     query = query.order("rating",     { ascending: false }); break;
    default:           query = query.order("code",       { ascending: true });
  }

  const { data, error } = await query.limit(300);
  if (error || !data) return [];

  let list: ApartmentListItem[] = (data as unknown[]).map((r: unknown) => {
    const row = r as {
      id: number; code: string; name: string; floor: number; base_price: number;
      max_guests: number; bedrooms: number; bathrooms: number; size_sqm: number;
      sea_view: boolean; balcony: boolean; cover_image: string; rating: number;
      review_count: number;
      blocks: { code: string };
      apartment_types: { code: string; name: string };
    };
    return {
      id: row.id, code: row.code, name: row.name,
      block_code: row.blocks.code,
      type_code: row.apartment_types.code,
      type_name: row.apartment_types.name,
      floor: row.floor, base_price: Number(row.base_price),
      max_guests: row.max_guests, bedrooms: row.bedrooms,
      bathrooms: row.bathrooms, size_sqm: row.size_sqm,
      sea_view: row.sea_view, balcony: row.balcony,
      cover_image: row.cover_image,
      rating: Number(row.rating), review_count: row.review_count,
    };
  });

  // Müsaitlik filtresi
  if (f.check_in && f.check_out && f.check_out > f.check_in) {
    const { data: booked } = await supabase
      .from("reservations")
      .select("apartment_id")
      .neq("status", "cancelled")
      .lt("check_in", f.check_out)
      .gt("check_out", f.check_in);
    const bookedSet = new Set((booked ?? []).map((b) => b.apartment_id));
    list = list.filter((a) => !bookedSet.has(a.id));
  }

  return list;
}

export async function getFeatured(limit = 6): Promise<ApartmentListItem[]> {
  const all = await searchApartments({ sea_view: true, sort: "rating" });
  return all.slice(0, limit);
}

export async function getApartmentDetail(id: number) {
  const { data: apt, error } = await supabase
    .from("apartments")
    .select(`
      id, code, name, floor, description, rules,
      base_price, max_guests, bedrooms, bathrooms, size_sqm,
      sea_view, balcony, cover_image, video_url, tour_360_url,
      rating, review_count,
      blocks!inner(code),
      apartment_types!inner(code, name)
    `)
    .eq("id", id)
    .single();

  if (error || !apt) return null;

  const row = apt as unknown as {
    id: number; code: string; name: string; floor: number;
    description: string; rules: string; base_price: number;
    max_guests: number; bedrooms: number; bathrooms: number; size_sqm: number;
    sea_view: boolean; balcony: boolean; cover_image: string;
    video_url: string; tour_360_url: string; rating: number; review_count: number;
    blocks: { code: string };
    apartment_types: { code: string; name: string };
  };

  const [
    { data: images },
    { data: amenityRows },
    { data: reviews },
    { data: booked },
  ] = await Promise.all([
    supabase.from("apartment_images").select("url").eq("apartment_id", id).order("sort_order"),
    supabase
      .from("apartment_amenities")
      .select("amenities(name, icon)")
      .eq("apartment_id", id),
    supabase
      .from("reservations")
      .select("id, guest_name: guest_name, rating: id, comment: note, created_at, author_name: guest_name")
      .eq("apartment_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("reservations")
      .select("check_in, check_out")
      .eq("apartment_id", id)
      .neq("status", "cancelled")
      .gte("check_out", new Date().toISOString().slice(0, 10)),
  ]);

  const amenities = (amenityRows ?? []).flatMap((r: unknown) => {
    const row = r as { amenities: { name: string; icon: string } | null };
    return row.amenities ? [row.amenities] : [];
  });

  return {
    id: row.id, code: row.code, name: row.name,
    block_code: row.blocks.code,
    type_code: row.apartment_types.code,
    type_name: row.apartment_types.name,
    floor: row.floor, description: row.description, rules: row.rules,
    base_price: Number(row.base_price),
    max_guests: row.max_guests, bedrooms: row.bedrooms,
    bathrooms: row.bathrooms, size_sqm: row.size_sqm,
    sea_view: row.sea_view, balcony: row.balcony,
    cover_image: row.cover_image, video_url: row.video_url,
    tour_360_url: row.tour_360_url,
    rating: Number(row.rating), review_count: row.review_count,
    images: (images ?? []).map((i) => i.url),
    amenities,
    reviews: reviews ?? [],
    booked_ranges: booked ?? [],
  };
}

export async function getSimilar(typeCode: string, excludeId: number, limit = 4) {
  const all = await searchApartments({ type: typeCode });
  return all.filter((a) => a.id !== excludeId).slice(0, limit);
}

export async function getActiveFacilities() {
  const { data } = await supabase
    .from("facilities")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  return data ?? [];
}
