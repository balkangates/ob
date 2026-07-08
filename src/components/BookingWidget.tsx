"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { createReservationAction, type FormState } from "@/lib/actions";

type Quote = {
  ok: boolean; error?: string;
  nights: number; subtotal: number;
  genius_percent: number; genius_discount: number;
  coupon_discount: number; coupon_code: string | null;
  total: number; avg_per_night: number;
};

const m = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export function BookingWidget({
  apartmentId, basePrice, maxGuests,
  defaultCheckIn, defaultCheckOut,
  user,
}: {
  apartmentId: number; basePrice: number; maxGuests: number;
  defaultCheckIn?: string; defaultCheckOut?: string;
  user: { full_name: string; email: string; phone: string; genius_level: number } | null;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [checkIn,    setCheckIn]    = useState(defaultCheckIn  || today);
  const [checkOut,   setCheckOut]   = useState(defaultCheckOut || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));
  const [guests,     setGuests]     = useState(2);
  const [couponCode, setCouponCode] = useState("");
  const [quote,      setQuote]      = useState<Quote | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(createReservationAction, {});

  const fetchQuote = useCallback(async () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) { setQuote(null); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        apartmentId:  String(apartmentId),
        checkIn, checkOut,
        geniusLevel:  String(user?.genius_level ?? 0),
        couponCode:   couponCode || "",
      });
      const res = await fetch(`/api/quote?${params}`);
      setQuote(await res.json());
    } finally {
      setLoading(false);
    }
  }, [apartmentId, checkIn, checkOut, couponCode, user?.genius_level]);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  return (
    <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-slate-900">{m(basePrice)}</span>
        <span className="text-sm text-slate-500">/ gece</span>
      </div>
      {user && user.genius_level > 0 && (
        <div className="mt-2 inline-block rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
          Genius indiriminiz uygulanır
        </div>
      )}

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="apartmentId" value={apartmentId} />
        <input type="hidden" name="checkIn"     value={checkIn} />
        <input type="hidden" name="checkOut"    value={checkOut} />
        <input type="hidden" name="guests"      value={guests} />
        <input type="hidden" name="couponCode"  value={couponCode} />

        {/* Tarihler */}
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-300">
          <label className="border-r border-slate-300 p-2">
            <span className="block text-[11px] font-semibold text-slate-500">GİRİŞ</span>
            <input type="date" value={checkIn} min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full text-sm outline-none" />
          </label>
          <label className="p-2">
            <span className="block text-[11px] font-semibold text-slate-500">ÇIKIŞ</span>
            <input type="date" value={checkOut} min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-sm outline-none" />
          </label>
        </div>

        {/* Misafir sayısı */}
        <label className="block rounded-lg border border-slate-300 p-2">
          <span className="block text-[11px] font-semibold text-slate-500">MİSAFİR</span>
          <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full text-sm outline-none">
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} misafir</option>
            ))}
          </select>
        </label>

        {/* Kupon */}
        <input value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Kupon kodu (opsiyonel)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-[#0071c2]"
        />

        {/* Fiyat özeti */}
        {loading && <div className="text-sm text-slate-400">Hesaplanıyor…</div>}
        {quote?.ok && (
          <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span>{m(quote.avg_per_night)} × {quote.nights} gece</span>
              <span>{m(quote.subtotal)}</span>
            </div>
            {quote.genius_discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Genius indirimi (%{quote.genius_percent})</span>
                <span>−{m(quote.genius_discount)}</span>
              </div>
            )}
            {quote.coupon_discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Kupon ({quote.coupon_code})</span>
                <span>−{m(quote.coupon_discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <span>Toplam</span>
              <span>{m(quote.total)}</span>
            </div>
          </div>
        )}
        {quote?.error && <div className="text-sm text-red-600">{quote.error}</div>}

        {/* Misafir bilgileri */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <input name="guestName"  defaultValue={user?.full_name}
            placeholder="Ad Soyad *" required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]" />
          <input name="guestEmail" type="email" defaultValue={user?.email}
            placeholder="E-posta *" required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]" />
          <input name="guestPhone" defaultValue={user?.phone}
            placeholder="Telefon"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]" />
          <textarea name="note" placeholder="Özel istek (opsiyonel)" rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]" />
        </div>

        {state.error && (
          <div className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
            {state.error}
          </div>
        )}

        <button type="submit" disabled={pending}
          className="w-full rounded-lg bg-amber-400 px-4 py-3 text-base font-bold text-[#003580] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "İşleniyor…" : "Rezervasyonu Onayla"}
        </button>
        <p className="text-center text-xs text-slate-400">
          Ödeme resepsiyonda · Ücretsiz iptal 48 saat öncesine kadar
        </p>
      </form>
    </div>
  );
}
