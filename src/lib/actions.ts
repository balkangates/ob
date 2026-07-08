// =================================================================
// ORBI LIFE — Server Actions (supabase-js, Drizzle yok)
// =================================================================
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { buildQuote, isAvailable, generateReference } from "@/lib/quote";
import { levelFromReservations, tierFor } from "@/lib/genius";

export type FormState = { error?: string; ok?: boolean };

function makeServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => (cookieStore as unknown as { getAll: () => { name: string; value: string }[] }).getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              (cookieStore as unknown as { set: (n: string, v: string, o: unknown) => void }).set(name, value, options)
            );
          } catch { /* Server component'ten çağrıldığında ignore */ }
        },
      },
    }
  );
}

// ------ AUTH ------

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email    = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "E-posta ve şifre gerekli." };

  const sb = makeServerClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "Geçersiz e-posta veya şifre." };

  const user = await getCurrentUser();
  redirect(user?.role === "admin" ? "/admin" : "/account");
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email     = String(formData.get("email") ?? "").trim().toLowerCase();
  const password  = String(formData.get("password") ?? "");
  const full_name = String(formData.get("fullName") ?? "").trim();
  const phone     = String(formData.get("phone") ?? "").trim();

  if (!email || !password || !full_name) return { error: "Ad, e-posta ve şifre zorunludur." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };

  const sb = makeServerClient();
  const { error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name, phone } },
  });
  if (error) return { error: error.message };

  redirect("/account");
}

export async function logoutAction() {
  const sb = makeServerClient();
  await sb.auth.signOut();
  redirect("/");
}

// ------ REZERVASYON ------

export async function createReservationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const apartment_id  = Number(formData.get("apartmentId"));
  const check_in      = String(formData.get("checkIn")  ?? "");
  const check_out     = String(formData.get("checkOut") ?? "");
  const guests        = Number(formData.get("guests") ?? 1);
  const coupon_code   = (formData.get("couponCode") as string | null)?.trim() || null;
  const guest_name    = String(formData.get("guestName")  ?? "").trim();
  const guest_email   = String(formData.get("guestEmail") ?? "").trim();
  const guest_phone   = String(formData.get("guestPhone") ?? "").trim();
  const note          = String(formData.get("note")  ?? "").trim();

  if (!apartment_id || !check_in || !check_out) return { error: "Lütfen tarih seçin." };
  if (!guest_name || !guest_email) return { error: "İsim ve e-posta gerekli." };
  if (check_out <= check_in) return { error: "Çıkış tarihi giriş tarihinden sonra olmalı." };

  const free = await isAvailable(apartment_id, check_in, check_out);
  if (!free) return { error: "Seçtiğiniz tarihler dolu. Lütfen başka tarih deneyin." };

  const user  = await getCurrentUser();
  const quote = await buildQuote({
    apartment_id, check_in, check_out,
    genius_level: user?.genius_level ?? 0,
    coupon_code,
  });
  if (!quote.ok) return { error: quote.error ?? "Fiyat hesaplanamadı." };

  const reference = generateReference();
  const admin = supabaseAdmin();

  const { error: resErr } = await admin.from("reservations").insert({
    reference, apartment_id,
    user_id: user?.id ?? null,
    check_in, check_out,
    nights: quote.nights, guests,
    base_price: quote.base_price,
    subtotal: quote.subtotal,
    genius_discount: quote.genius_discount,
    coupon_discount: quote.coupon_discount,
    total_price: quote.total,
    coupon_id: quote.coupon_id,
    guest_name, guest_email, guest_phone, note,
    status: "confirmed",
    payment_status: "unpaid",
  });
  if (resErr) return { error: "Rezervasyon oluşturulamadı: " + resErr.message };

  // Kupon kullanım sayısını artır
  if (quote.coupon_id) {
    await admin.rpc("increment_coupon_usage" as never, { p_coupon_id: quote.coupon_id } as never);
  }

  // Genius seviyesi güncelle
  if (user) {
    const { count } = await admin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "cancelled");
    const total_reservations = count ?? 0;
    const new_level = levelFromReservations(total_reservations);

    await admin.from("profiles").update({ total_reservations, genius_level: new_level }).eq("id", user.id);

    if (new_level > user.genius_level) {
      const tier = tierFor(new_level);
      // Bildirim: gerçek e-posta entegrasyonu için Supabase Edge Function kullanılabilir
      console.log(`[genius] ${user.email} → ${tier.name} seviyesine yükseldi`);
    }
  }

  revalidatePath("/account");
  redirect(`/reservation/${reference}`);
}

export async function createReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Yorum yapmak için giriş yapın." };

  const apartment_id = Number(formData.get("apartmentId"));
  const rating       = Number(formData.get("rating") ?? 5);
  const comment      = String(formData.get("comment") ?? "").trim();
  if (!apartment_id || !comment) return { error: "Lütfen yorumunuzu yazın." };

  const admin = supabaseAdmin();

  // Reservations tablosuna review bilgisi not olarak işlenir (basit mimari)
  // Gerçek review tablosu eklemek isterseniz migration.sql'e reviews tablosu eklenebilir.
  // Şimdilik rezervasyonun note alanını güncelliyoruz (misafir kendi rezervasyonunu yorumluyor).
  const reservation_id = Number(formData.get("reservationId") ?? 0);
  if (reservation_id) {
    await admin.from("reservations").update({ note: comment }).eq("id", reservation_id).eq("user_id", user.id);
  }

  // Daire rating'ini güncelle (basit ortalama: (eski_rating * eski_count + yeni) / (eski_count + 1))
  const { data: apt } = await admin.from("apartments").select("rating, review_count").eq("id", apartment_id).single();
  if (apt) {
    const old_total = Number(apt.rating) * apt.review_count;
    const new_count = apt.review_count + 1;
    const new_rating = Math.round((old_total + rating) / new_count * 100) / 100;
    await admin.from("apartments").update({ rating: new_rating, review_count: new_count }).eq("id", apartment_id);
  }

  revalidatePath(`/apartment/${apartment_id}`);
  return { ok: true };
}
