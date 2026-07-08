// =================================================================
// ORBI LIFE — Admin Server Actions (supabase-js)
// =================================================================
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { parseCSV, parseBool, parseNumber } from "@/lib/csv";

async function guard() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Yetkisiz erişim.");
  return supabaseAdmin();
}

// ------ APARTMAN ------

export async function toggleApartmentStatus(formData: FormData) {
  const sb = await guard();
  const id = Number(formData.get("id"));
  const { data } = await sb.from("apartments").select("status").eq("id", id).single();
  await sb.from("apartments").update({ status: data?.status === "active" ? "inactive" : "active" }).eq("id", id);
  revalidatePath("/admin");
}

export async function updateApartmentPrice(formData: FormData) {
  const sb = await guard();
  const id    = Number(formData.get("id"));
  const price = Number(formData.get("price") ?? 0);
  await sb.from("apartments").update({ base_price: price }).eq("id", id);
  revalidatePath("/admin");
}

// ------ CSV TOPLU DAİRE İÇE AKTAR ------
//
// Beklenen CSV başlıkları (sırasız olabilir, büyük/küçük harf önemsiz):
//   blok, kat, oda_no, tip_kodu, fiyat, m2, yatak, banyo, kapasite,
//   deniz_manzarasi, balkon, aciklama, gorsel_linkleri, video_linki
//
// - blok, kat, oda_no, tip_kodu, fiyat ZORUNLU alanlardır.
// - tip_kodu (ör. "1+1") apartment_types tablosunda yoksa, yatak/banyo/
//   kapasite değerleriyle otomatik oluşturulur.
// - gorsel_linkleri birden fazla URL'i "|" ile ayırarak alır; ilki
//   cover_image olur, tümü apartment_images tablosuna eklenir.
// - Aynı kod (blok-kat-oda_no) ile tekrar yüklenirse mevcut daire
//   GÜNCELLENİR (upsert), yeni satır oluşturulmaz.
export type BulkImportResult = {
  total: number;
  inserted: number;
  updated: number;
  errors: { row: number; message: string }[];
};

export async function bulkImportApartments(formData: FormData) {
  const sb = await guard();

  const file = formData.get("csvFile") as File | null;
  if (!file || file.size === 0) {
    redirect("/admin?import=error&msg=" + encodeURIComponent("CSV dosyası seçilmedi."));
  }

  const text = await file!.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    redirect("/admin?import=error&msg=" + encodeURIComponent("CSV dosyası boş görünüyor."));
  }

  const { data: blocks } = await sb.from("blocks").select("id, code");
  const { data: types }  = await sb.from("apartment_types").select("id, code");

  const blockMap = new Map((blocks ?? []).map((b) => [b.code.toUpperCase(), b.id]));
  const typeMap  = new Map((types ?? []).map((t) => [t.code.toUpperCase(), t.id]));

  let inserted = 0;
  let updated = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // +1 başlık satırı, +1 1-indexli

    try {
      const blokRaw = (r["blok"] ?? "").trim().toUpperCase();
      const kat     = parseNumber(r["kat"], NaN);
      const odaNo   = parseNumber(r["oda_no"], NaN);
      const tipKodu = (r["tip_kodu"] ?? "").trim();
      const fiyat   = parseNumber(r["fiyat"], NaN);

      if (!blokRaw)                 throw new Error("blok alanı boş");
      if (Number.isNaN(kat))        throw new Error("kat alanı geçersiz");
      if (Number.isNaN(odaNo))      throw new Error("oda_no alanı geçersiz");
      if (!tipKodu)                 throw new Error("tip_kodu alanı boş");
      if (Number.isNaN(fiyat))      throw new Error("fiyat alanı geçersiz");

      let blockId = blockMap.get(blokRaw);
      if (!blockId) throw new Error(`blok bulunamadı: "${blokRaw}" (önce blocks tablosuna eklenmeli)`);

      let typeId = typeMap.get(tipKodu.toUpperCase());
      if (!typeId) {
        // Tip yoksa otomatik oluştur
        const bedrooms   = parseNumber(r["yatak"], 1);
        const bathrooms  = parseNumber(r["banyo"], 1);
        const maxGuests  = parseNumber(r["kapasite"], 2);
        const { data: newType, error: typeErr } = await sb
          .from("apartment_types")
          .insert({ code: tipKodu, name: tipKodu, bedrooms, bathrooms, max_guests: maxGuests })
          .select("id")
          .single();
        if (typeErr || !newType) throw new Error(`tip oluşturulamadı: ${typeErr?.message ?? "bilinmeyen hata"}`);
        typeId = newType.id;
        typeMap.set(tipKodu.toUpperCase(), typeId);
      }

      const floorPadded = String(kat).padStart(2, "0");
      const roomPadded  = String(odaNo).padStart(2, "0");
      const code = `${blokRaw}-${floorPadded}${roomPadded}`;
      const name = `${blokRaw} Blok ${tipKodu} No:${floorPadded}${roomPadded}`;

      const imageLinks = (r["gorsel_linkleri"] ?? "")
        .split("|").map((s) => s.trim()).filter(Boolean);
      const coverImage = imageLinks[0] ?? "";
      const videoUrl = (r["video_linki"] ?? "").trim();
      const sizeSqm = parseNumber(r["m2"], 35);
      const seaView = parseBool(r["deniz_manzarasi"]);
      const balcony = parseBool(r["balkon"]);
      const description = (r["aciklama"] ?? "").trim();

      const { data: existing } = await sb
        .from("apartments").select("id").eq("code", code).maybeSingle();

      const payload = {
        code, name,
        block_id: blockId, type_id: typeId,
        floor: kat,
        description,
        base_price: fiyat,
        size_sqm: sizeSqm,
        sea_view: seaView,
        balcony,
        cover_image: coverImage,
        video_url: videoUrl,
        status: "active",
      };

      let apartmentId: number;
      if (existing) {
        await sb.from("apartments").update(payload).eq("id", existing.id);
        apartmentId = existing.id;
        updated++;
      } else {
        const { data: created, error: insErr } = await sb
          .from("apartments").insert(payload).select("id").single();
        if (insErr || !created) throw new Error(`daire eklenemedi: ${insErr?.message ?? "bilinmeyen hata"}`);
        apartmentId = created.id;
        inserted++;
      }

      if (imageLinks.length > 0) {
        await sb.from("apartment_images").delete().eq("apartment_id", apartmentId);
        await sb.from("apartment_images").insert(
          imageLinks.map((url, idx) => ({ apartment_id: apartmentId, url, sort_order: idx }))
        );
      }
    } catch (e) {
      errors.push({ row: rowNum, message: e instanceof Error ? e.message : String(e) });
    }
  }

  revalidatePath("/admin");

  const params = new URLSearchParams({
    import: "done",
    total: String(rows.length),
    inserted: String(inserted),
    updated: String(updated),
    errors: String(errors.length),
  });
  if (errors.length > 0) {
    params.set("errmsg", errors.slice(0, 5).map((e) => `Satır ${e.row}: ${e.message}`).join(" | "));
  }
  redirect(`/admin?${params.toString()}`);
}

// ------ TESİS ------

export async function toggleFacility(formData: FormData) {
  const sb = await guard();
  const id = Number(formData.get("id"));
  const { data } = await sb.from("facilities").select("active").eq("id", id).single();
  await sb.from("facilities").update({ active: !data?.active }).eq("id", id);
  revalidatePath("/admin");
}

export async function addFacility(formData: FormData) {
  const sb = await guard();
  await sb.from("facilities").insert({
    name:        String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    icon:        String(formData.get("icon") ?? "🏨").trim(),
    hours:       String(formData.get("hours") ?? "24/7").trim(),
    sort_order:  Number(formData.get("sortOrder") ?? 0),
  });
  revalidatePath("/admin");
}

// ------ KUPON ------

export async function addCoupon(formData: FormData) {
  const sb = await guard();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return;
  await sb.from("coupons").insert({
    code,
    discount_type:  String(formData.get("discountType") ?? "percent"),
    discount_value: Number(formData.get("discountValue") ?? 10),
    min_nights:     Number(formData.get("minNights") ?? 1),
    max_uses:       Number(formData.get("maxUses") ?? 1000),
    valid_from:     (formData.get("validFrom") as string) || null,
    valid_to:       (formData.get("validTo") as string) || null,
  });
  revalidatePath("/admin");
}

export async function toggleCoupon(formData: FormData) {
  const sb = await guard();
  const id = Number(formData.get("id"));
  const { data } = await sb.from("coupons").select("active").eq("id", id).single();
  await sb.from("coupons").update({ active: !data?.active }).eq("id", id);
  revalidatePath("/admin");
}

// ------ REZERVASYON ------

export async function setReservationStatus(formData: FormData) {
  const sb = await guard();
  const id     = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "confirmed");
  await sb.from("reservations").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function setPaymentStatus(formData: FormData) {
  const sb = await guard();
  const id             = Number(formData.get("id"));
  const payment_status = String(formData.get("paymentStatus") ?? "unpaid");
  await sb.from("reservations").update({ payment_status }).eq("id", id);
  revalidatePath("/admin");
}

// ------ KASA ------

export async function addCashTransaction(formData: FormData) {
  const sb = await guard();
  await sb.from("cash_transactions").insert({
    reservation_id: Number(formData.get("reservationId")) || null,
    guest_name:     String(formData.get("guestName") ?? "").trim(),
    apartment_code: String(formData.get("apartmentCode") ?? "").trim(),
    amount:         Number(formData.get("amount") ?? 0),
    payment_type:   String(formData.get("paymentType") ?? "cash"),
    note:           String(formData.get("note") ?? "").trim(),
    paid_at:        String(formData.get("paidAt") ?? new Date().toISOString().slice(0, 10)),
  });
  revalidatePath("/admin");
}

// ------ AYARLAR ------

export async function updateSettings(formData: FormData) {
  const sb = await guard();
  await sb.from("settings").update({
    site_name:      String(formData.get("siteName") ?? "").trim(),
    site_url:       String(formData.get("siteUrl") ?? "").trim(),
    contact_email:  String(formData.get("contactEmail") ?? "").trim(),
    contact_phone:  String(formData.get("contactPhone") ?? "").trim(),
    check_in_time:  String(formData.get("checkInTime") ?? "14:00").trim(),
    check_out_time: String(formData.get("checkOutTime") ?? "12:00").trim(),
    currency:       String(formData.get("currency") ?? "USD").trim(),
  }).eq("id", 1);
  revalidatePath("/admin");
}
