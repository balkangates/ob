// =================================================================
// ORBI LIFE — Admin Server Actions (supabase-js)
// =================================================================
"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

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
