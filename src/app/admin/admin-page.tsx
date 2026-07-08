import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { money, formatDate } from "@/lib/format";
import {
  toggleApartmentStatus, updateApartmentPrice, bulkImportApartments,
  toggleFacility, addFacility,
  addCoupon, toggleCoupon,
  setReservationStatus, setPaymentStatus,
  addCashTransaction, updateSettings,
} from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const sb = supabaseAdmin();

  const [
    { count: aptCount },
    { count: activeCount },
    { count: resvCount },
    { count: userCount },
    { data: revenueData },
    { data: recentResv },
    { data: coupons },
    { data: facilities },
    { data: apartments },
    { data: cashRows },
    { data: settings },
  ] = await Promise.all([
    sb.from("apartments").select("id", { count: "exact", head: true }),
    sb.from("apartments").select("id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("reservations").select("id", { count: "exact", head: true }),
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("reservations").select("total_price").neq("status", "cancelled"),
    sb.from("reservations").select(`
      id, reference, guest_name, check_in, check_out,
      total_price, status, payment_status, created_at,
      apartments(code, name)
    `).order("created_at", { ascending: false }).limit(15),
    sb.from("coupons").select("*").order("id", { ascending: false }),
    sb.from("facilities").select("*").order("sort_order"),
    sb.from("apartments").select("id, code, name, base_price, status, blocks(code)").order("code").limit(150),
    sb.from("cash_transactions").select("*").order("paid_at", { ascending: false }).limit(50),
    sb.from("settings").select("*").eq("id", 1).single(),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((s, r) => s + Number(r.total_price), 0);
  const today = new Date().toISOString().slice(0, 10);
  const dailyCash = (cashRows ?? [])
    .filter((t) => t.paid_at === today)
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthlyCash = (cashRows ?? [])
    .filter((t) => t.paid_at?.startsWith(today.slice(0, 7)))
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Admin Panel</h1>
          <p className="text-sm text-slate-500">Orbi Life yönetim merkezi</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-[#0071c2] hover:underline">← Siteye dön</Link>
      </div>

      {/* KPI'lar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Toplam Daire",       value: aptCount ?? 0 },
          { label: "Aktif Daire",        value: activeCount ?? 0 },
          { label: "Rezervasyon",        value: resvCount ?? 0 },
          { label: "Üye",                value: userCount ?? 0 },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl font-extrabold text-[#003580]">{k.value}</div>
            <div className="mt-1 text-sm text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Kasa Özeti */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-slate-800">💰 Kasa</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-xl font-bold text-green-700">{money(dailyCash)}</div>
            <div className="text-xs text-slate-500 mt-1">Bugün Tahsilat</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <div className="text-xl font-bold text-blue-700">{money(monthlyCash)}</div>
            <div className="text-xs text-slate-500 mt-1">Bu Ay Tahsilat</div>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <div className="text-xl font-bold text-purple-700">{money(totalRevenue)}</div>
            <div className="text-xs text-slate-500 mt-1">Toplam Rezervasyon Değeri</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 text-center">
            <div className="text-xl font-bold text-orange-700">
              {(recentResv ?? []).filter((r) => (r as { payment_status: string }).payment_status === "unpaid").length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Bekleyen Ödeme</div>
          </div>
        </div>

        {/* Kasa Kaydı Ekle */}
        <form action={addCashTransaction} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <input name="guestName"     placeholder="Misafir adı"    className="rounded-lg border px-3 py-2 text-sm" required />
          <input name="apartmentCode" placeholder="Daire kodu"     className="rounded-lg border px-3 py-2 text-sm" />
          <input name="amount"  type="number" placeholder="Tutar ($)" className="rounded-lg border px-3 py-2 text-sm" required min="0" step="0.01" />
          <select name="paymentType" className="rounded-lg border px-3 py-2 text-sm">
            <option value="cash">Nakit</option>
            <option value="pos">POS</option>
            <option value="transfer">Havale</option>
          </select>
          <input name="note"    placeholder="Açıklama"      className="rounded-lg border px-3 py-2 text-sm col-span-2" />
          <input name="paidAt"  type="date" defaultValue={today} className="rounded-lg border px-3 py-2 text-sm" />
          <button className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700">Kaydet</button>
        </form>

        {/* Son Kasa Kayıtları */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-slate-500">
              <th className="pb-2 pr-4">Tarih</th><th className="pb-2 pr-4">Misafir</th>
              <th className="pb-2 pr-4">Daire</th><th className="pb-2 pr-4">Tür</th>
              <th className="pb-2 pr-4 text-right">Tutar</th><th className="pb-2">Not</th>
            </tr></thead>
            <tbody>
              {(cashRows ?? []).slice(0, 20).map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-slate-400">{t.paid_at}</td>
                  <td className="py-2 pr-4 font-medium">{t.guest_name}</td>
                  <td className="py-2 pr-4 text-slate-500">{t.apartment_code}</td>
                  <td className="py-2 pr-4">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t.payment_type}</span>
                  </td>
                  <td className="py-2 pr-4 text-right font-bold text-green-700">{money(Number(t.amount))}</td>
                  <td className="py-2 text-slate-500 text-xs">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rezervasyonlar */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-slate-800">📋 Rezervasyonlar</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-slate-500">
              <th className="pb-2 pr-4">Ref.</th><th className="pb-2 pr-4">Misafir</th>
              <th className="pb-2 pr-4">Daire</th><th className="pb-2 pr-4">Tarihler</th>
              <th className="pb-2 pr-4 text-right">Tutar</th>
              <th className="pb-2 pr-4">Durum</th><th className="pb-2">Ödeme</th>
            </tr></thead>
            <tbody>
              {(recentResv ?? []).map((r) => {
                const row = r as unknown as {
                  id: number; reference: string; guest_name: string;
                  check_in: string; check_out: string; total_price: number;
                  status: string; payment_status: string; created_at: string;
                  apartments: { code: string; name: string } | null;
                };
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-[#0071c2]">{row.reference}</td>
                    <td className="py-2 pr-4 font-medium">{row.guest_name}</td>
                    <td className="py-2 pr-4 text-slate-500">{row.apartments?.code}</td>
                    <td className="py-2 pr-4 text-xs text-slate-500">{row.check_in} → {row.check_out}</td>
                    <td className="py-2 pr-4 text-right font-bold">{money(Number(row.total_price))}</td>
                    <td className="py-2 pr-4">
                      <form action={setReservationStatus} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={row.id} />
                        <select name="status" defaultValue={row.status} className="rounded border px-1 py-0.5 text-xs">
                          {["pending","confirmed","cancelled","checked_in","checked_out"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button className="text-xs text-[#0071c2] hover:underline">Kaydet</button>
                      </form>
                    </td>
                    <td className="py-2">
                      <form action={setPaymentStatus} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={row.id} />
                        <select name="paymentStatus" defaultValue={row.payment_status} className="rounded border px-1 py-0.5 text-xs">
                          {["unpaid","paid","refunded"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button className="text-xs text-[#0071c2] hover:underline">Kaydet</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* CSV Toplu Daire İçe Aktar */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-extrabold text-slate-800">📥 Toplu Daire İçe Aktar (CSV)</h2>
        <p className="mb-4 text-sm text-slate-500">
          Sütunlar: <code className="rounded bg-slate-100 px-1">blok, kat, oda_no, tip_kodu, fiyat, m2, yatak, banyo, kapasite, deniz_manzarasi, balkon, aciklama, gorsel_linkleri, video_linki</code>.
          {" "}<code className="rounded bg-slate-100 px-1">gorsel_linkleri</code> birden fazla URL'i <code className="rounded bg-slate-100 px-1">|</code> ile ayırır.
          Aynı blok+kat+oda_no ile tekrar yüklersen mevcut daire güncellenir.
        </p>

        {sp.import === "done" && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            ✅ {sp.total} satır işlendi — {sp.inserted} yeni daire eklendi, {sp.updated} daire güncellendi.
            {Number(sp.errors ?? 0) > 0 && (
              <div className="mt-1 text-red-700">
                ⚠️ {sp.errors} satırda hata oluştu: {sp.errmsg}
              </div>
            )}
          </div>
        )}
        {sp.import === "error" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ❌ {sp.msg}
          </div>
        )}

        <form action={bulkImportApartments} className="flex flex-wrap items-center gap-3">
          <input
            type="file" name="csvFile" accept=".csv,text/csv" required
            className="rounded-lg border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#003580] file:px-3 file:py-1.5 file:text-white file:text-sm"
          />
          <button className="rounded-lg bg-[#003580] px-4 py-2 text-sm font-semibold text-white">
            CSV'yi İçe Aktar
          </button>
        </form>
      </section>

      {/* Daireler */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-slate-800">🏠 Daireler</h2>
        <div className="grid gap-2">
          {(apartments ?? []).map((a) => {
            const apt = a as unknown as { id: number; code: string; name: string; base_price: number; status: string; blocks: { code: string } | null };
            return (
              <div key={apt.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${apt.status === "active" ? "bg-green-500" : "bg-slate-300"}`} />
                  <span className="font-mono text-sm font-semibold">{apt.code}</span>
                  <span className="text-sm text-slate-600">{apt.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 text-xs">Blok {apt.blocks?.code}</span>
                </div>
                <div className="flex items-center gap-3">
                  <form action={updateApartmentPrice} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={apt.id} />
                    <input name="price" type="number" defaultValue={apt.base_price} className="w-24 rounded border px-2 py-1 text-sm" />
                    <button className="text-xs text-[#0071c2] hover:underline">Güncelle</button>
                  </form>
                  <form action={toggleApartmentStatus}>
                    <input type="hidden" name="id" value={apt.id} />
                    <button className={`rounded-full px-3 py-1 text-xs font-semibold ${apt.status === "active" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {apt.status === "active" ? "Durdur" : "Aktifleştir"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tesisler */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-slate-800">🏨 Tesisler</h2>
        <form action={addFacility} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <input name="name"        placeholder="Tesis adı"  className="rounded-lg border px-3 py-2 text-sm" required />
          <input name="icon"        placeholder="Emoji"      className="rounded-lg border px-3 py-2 text-sm" defaultValue="🏨" />
          <input name="hours"       placeholder="Saatler"    className="rounded-lg border px-3 py-2 text-sm" defaultValue="24/7" />
          <input name="description" placeholder="Açıklama"   className="rounded-lg border px-3 py-2 text-sm" />
          <button className="rounded-lg bg-[#003580] text-white px-4 py-2 text-sm font-semibold col-span-2 md:col-span-1">Ekle</button>
        </form>
        <div className="grid gap-2">
          {(facilities ?? []).map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="font-medium">{f.name}</span>
                <span className="text-xs text-slate-400">{f.hours}</span>
              </div>
              <form action={toggleFacility}>
                <input type="hidden" name="id" value={f.id} />
                <button className={`rounded-full px-3 py-1 text-xs font-semibold ${f.active ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                  {f.active ? "Kapat" : "Aç"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Kuponlar */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-slate-800">🎟️ Kuponlar</h2>
        <form action={addCoupon} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <input name="code"          placeholder="Kod (YAZI20)"  className="rounded-lg border px-3 py-2 text-sm uppercase" required />
          <select name="discountType" className="rounded-lg border px-3 py-2 text-sm">
            <option value="percent">Yüzde</option>
            <option value="fixed">Sabit $</option>
          </select>
          <input name="discountValue" type="number" placeholder="Değer" className="rounded-lg border px-3 py-2 text-sm" defaultValue={10} />
          <input name="minNights"     type="number" placeholder="Min. gece" className="rounded-lg border px-3 py-2 text-sm" defaultValue={1} />
          <button className="rounded-lg bg-[#003580] text-white px-4 py-2 text-sm font-semibold">Ekle</button>
        </form>
        <div className="grid gap-2">
          {(coupons ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${c.active ? "bg-green-500" : "bg-slate-300"}`} />
                <span className="font-mono font-bold">{c.code}</span>
                <span className="text-sm text-slate-600">
                  {c.discount_type === "percent" ? `%${c.discount_value}` : `$${c.discount_value}`}
                  {" · "}min {c.min_nights} gece
                </span>
                <span className="text-xs text-slate-400">{c.used_count}/{c.max_uses} kullanım</span>
              </div>
              <form action={toggleCoupon}>
                <input type="hidden" name="id" value={c.id} />
                <button className={`rounded-full px-3 py-1 text-xs font-semibold ${c.active ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                  {c.active ? "Kapat" : "Aç"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Site Ayarları */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-extrabold text-slate-800">⚙️ Site Ayarları</h2>
        <form action={updateSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "siteName",      label: "Site Adı",         defaultValue: settings?.data?.site_name },
            { name: "siteUrl",       label: "Site URL",         defaultValue: settings?.data?.site_url },
            { name: "contactEmail",  label: "E-posta",          defaultValue: settings?.data?.contact_email },
            { name: "contactPhone",  label: "Telefon",          defaultValue: settings?.data?.contact_phone },
            { name: "checkInTime",   label: "Check-in Saati",   defaultValue: settings?.data?.check_in_time },
            { name: "checkOutTime",  label: "Check-out Saati",  defaultValue: settings?.data?.check_out_time },
            { name: "currency",      label: "Para Birimi",      defaultValue: settings?.data?.currency },
          ].map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{f.label}</label>
              <input name={f.name} defaultValue={f.defaultValue ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0071c2] outline-none" />
            </div>
          ))}
          <div className="md:col-span-2">
            <button className="rounded-lg bg-[#003580] text-white px-6 py-2 text-sm font-semibold hover:bg-[#002060]">Kaydet</button>
          </div>
        </form>
      </section>
    </div>
  );
}
