import Link from "next/link";
import { money } from "@/lib/format";
import { ScoreBadge } from "./StarRating";
import type { ApartmentListItem } from "@/lib/data";

export function ApartmentCard({
  apt, checkIn, checkOut,
}: {
  apt: ApartmentListItem; checkIn?: string; checkOut?: string;
}) {
  const qs = checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : "";
  return (
    <Link
      href={`/apartment/${apt.id}${qs}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {apt.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={apt.cover_image}
            alt={apt.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl bg-slate-100">🏠</div>
        )}
        {apt.sea_view && (
          <span className="absolute left-2 top-2 rounded-full bg-[#003580] px-2 py-1 text-xs font-semibold text-white">
            🌊 Deniz Manzarası
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700">
          {apt.code}
        </span>
        {apt.balcony && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate-600">
            🌅 Balkon
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#0071c2]">
          {apt.type_name} · Blok {apt.block_code}
        </div>
        <h3 className="line-clamp-2 text-base font-bold text-slate-800 group-hover:text-[#003580]">
          {apt.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {apt.size_sqm} m² · {apt.bedrooms > 0 ? `${apt.bedrooms} yatak odası` : "Stüdyo"} · maks. {apt.max_guests} kişi
        </p>
        <div className="mt-3">
          <ScoreBadge value={apt.rating} count={apt.review_count} />
        </div>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <div className="text-xs text-slate-500">gecelik</div>
            <div className="text-xl font-extrabold text-slate-900">{money(apt.base_price)}</div>
          </div>
          <span className="rounded-lg bg-[#0071c2] px-3 py-2 text-sm font-semibold text-white transition group-hover:bg-[#003580]">
            Detaylar
          </span>
        </div>
      </div>
    </Link>
  );
}
