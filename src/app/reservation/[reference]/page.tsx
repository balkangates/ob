import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { money, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("reservations")
    .select(`
      id, reference, guest_name, guest_email, guest_phone,
      check_in, check_out, nights, guests,
      subtotal, genius_discount, coupon_discount, total_price,
      status, payment_status, note,
      apartments(code, name, cover_image, blocks(code))
    `)
    .eq("reference", reference)
    .single();

  if (error || !data) notFound();

  const r = data as typeof data & {
    apartments: {
      code: string;
      name: string;
      cover_image: string;
      blocks: { code: string } | null;
    } | null;
  };

  const statusLabel: Record<string, string> = {
    pending:      "Bekliyor",
    confirmed:    "Onaylandı",
    cancelled:    "İptal",
    checked_in:   "Giriş Yapıldı",
    checked_out:  "Çıkış Yapıldı",
  };

  const paymentLabel: Record<string, string> = {
    unpaid:   "Ödeme Bekleniyor (Resepsiyonda)",
    paid:     "Ödendi ✓",
    refunded: "İade Edildi",
  };

  const paymentColor: Record<string, string> = {
    unpaid:   "text-orange-600",
    paid:     "text-green-600",
    refunded: "text-slate-500",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Başlık */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✅
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-800">
            Rezervasyon Onaylandı!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Onay numaranız:{" "}
            <span className="font-bold text-[#003580]">{r.reference}</span>
          </p>
          <div className="mt-2 inline-flex gap-2">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              {statusLabel[r.status] ?? r.status}
            </span>
            <span className={`rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold ${paymentColor[r.payment_status] ?? ""}`}>
              {paymentLabel[r.payment_status] ?? r.payment_status}
            </span>
          </div>
        </div>

        {/* Daire bilgisi */}
        {r.apartments && (
          <div className="mt-6 flex gap-4 rounded-xl bg-slate-50 p-4">
            {r.apartments.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.apartments.cover_image}
                alt={r.apartments.name}
                className="h-24 w-32 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-slate-200 text-3xl">
                🏠
              </div>
            )}
            <div>
              <div className="font-bold text-slate-800">{r.apartments.name}</div>
              <div className="text-sm text-slate-500">
                Blok {r.apartments.blocks?.code} · {r.apartments.code}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {formatDate(r.check_in)} → {formatDate(r.check_out)}
              </div>
              <div className="text-sm text-slate-600">
                {r.nights} gece · {r.guests} misafir
              </div>
            </div>
          </div>
        )}

        {/* Misafir bilgileri */}
        <div className="mt-6 space-y-2 text-sm">
          <Row label="Misafir"  value={r.guest_name} />
          <Row label="E-posta"  value={r.guest_email} />
          {r.guest_phone && <Row label="Telefon" value={r.guest_phone} />}
          {r.note && <Row label="Not" value={r.note} />}

          <div className="my-3 border-t border-slate-200" />

          <Row label="Ara toplam" value={money(Number(r.subtotal))} />
          {Number(r.genius_discount) > 0 && (
            <Row label="Genius indirimi" value={`−${money(Number(r.genius_discount))}`} green />
          )}
          {Number(r.coupon_discount) > 0 && (
            <Row label="Kupon indirimi" value={`−${money(Number(r.coupon_discount))}`} green />
          )}

          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold">
            <span>Toplam</span>
            <span>{money(Number(r.total_price))}</span>
          </div>

          <div className={`text-right text-xs font-semibold ${paymentColor[r.payment_status] ?? ""}`}>
            {paymentLabel[r.payment_status] ?? r.payment_status}
          </div>

          {r.payment_status === "unpaid" && (
            <div className="mt-2 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
              💡 Ödeme resepsiyonda nakit, POS veya havale ile yapılabilir.
            </div>
          )}
        </div>

        {/* Butonlar */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/account"
            className="flex-1 rounded-lg bg-[#003580] px-4 py-2.5 text-center font-semibold text-white hover:bg-[#00224f]"
          >
            Rezervasyonlarım
          </Link>
          <Link
            href="/search"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Yeni Arama
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={green ? "font-medium text-green-700" : "font-medium text-slate-800"}>
        {value}
      </span>
    </div>
  );
}
