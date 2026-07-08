// =================================================================
// ORBI LIFE — Supabase Client (tek DB katmanı, Drizzle/pg yok)
// Tüm veri erişimi bu dosyadaki client'lar üzerinden yapılır.
// =================================================================
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil.");
}

// Tarayıcı + sunucu (anon key, RLS'e tabi) — sayfa bileşenlerinde kullanılır
export const supabase = createClient<Database>(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Sunucu tarafı admin işlemleri (service role, RLS bypass)
// Yalnızca Server Actions ve Route Handlers'da çağrılmalı
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY tanımlı değil.");
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const MEDIA_BUCKET = "apartment-media";

// Storage: apartman medyası yükle
export async function uploadMedia(file: File, apartmentCode: string) {
  const admin = supabaseAdmin();
  const ext  = file.name.split(".").pop() ?? "jpg";
  const path = `${apartmentCode}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: false });
  if (error) return { url: "", error: error.message };
  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: undefined };
}
