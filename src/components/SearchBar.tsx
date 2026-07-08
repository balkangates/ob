"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TODAY = new Date().toISOString().slice(0, 10);
const TOMORROW = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);

const TYPES = [
  { code: "", name: "Tüm Tipler" },
  { code: "studio", name: "Studio (1+0)" },
  { code: "1+1", name: "1+1" },
  { code: "2+1", name: "2+1" },
  { code: "3+1", name: "3+1" },
  { code: "penthouse", name: "Penthouse" },
  { code: "loft", name: "Loft" },
  { code: "duplex", name: "Duplex" },
];

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(TODAY);
  const [checkOut, setCheckOut] = useState(TOMORROW);
  const [guests, setGuests] = useState(2);
  const [type, setType] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", String(guests));
    if (type) params.set("type", type);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className={`grid gap-2 rounded-xl bg-amber-400 p-2 shadow-xl ${
        compact ? "md:grid-cols-5" : "md:grid-cols-5"
      }`}
    >
      <div className="rounded-lg bg-white px-3 py-2">
        <label className="block text-[11px] font-semibold text-slate-500">DAİRE TİPİ</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
        >
          {TYPES.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-lg bg-white px-3 py-2">
        <label className="block text-[11px] font-semibold text-slate-500">GİRİŞ</label>
        <input
          type="date"
          value={checkIn}
          min={TODAY}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
        />
      </div>
      <div className="rounded-lg bg-white px-3 py-2">
        <label className="block text-[11px] font-semibold text-slate-500">ÇIKIŞ</label>
        <input
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
        />
      </div>
      <div className="rounded-lg bg-white px-3 py-2">
        <label className="block text-[11px] font-semibold text-slate-500">MİSAFİR</label>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n} misafir
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-[#003580] px-4 py-2 text-base font-bold text-white transition hover:bg-[#00224f]"
      >
        Ara
      </button>
    </form>
  );
}
