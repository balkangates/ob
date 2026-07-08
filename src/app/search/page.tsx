import Link from "next/link";
import { ApartmentCard } from "@/components/ApartmentCard";
import { searchApartments, getFacets, type SearchFilters } from "@/lib/data";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters: SearchFilters = {
    q: str(sp.q),
    block: str(sp.block),
    type: str(sp.type),
    guests: sp.guests ? Number(str(sp.guests)) : undefined,
    min_price: sp.minPrice ? Number(str(sp.minPrice)) : undefined,
    max_price: sp.maxPrice ? Number(str(sp.maxPrice)) : undefined,
    sea_view: str(sp.seaView) === "1",
    sort: str(sp.sort) || "code",
    check_in: str(sp.checkIn),
    check_out: str(sp.checkOut),
  };

  const [results, facets] = await Promise.all([searchApartments(filters), getFacets()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Daireler</h1>
          <p className="text-sm text-slate-500">
            {results.length} daire bulundu
            {filters.check_in && filters.check_out ? ` · ${filters.check_in} → ${filters.check_out}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* FILTERS */}
        <aside>
          <form className="sticky top-20 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {filters.check_in && <input type="hidden" name="checkIn" defaultValue={filters.check_in} />}
            {filters.check_out && <input type="hidden" name="checkOut" defaultValue={filters.check_out} />}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Ara</label>
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Daire kodu veya adı"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Blok</label>
              <select name="block" defaultValue={filters.block || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Tümü</option>
                {facets.blocks.map((b) => (
                  <option key={b.id} value={b.code}>
                    Blok {b.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Daire Tipi</label>
              <select name="type" defaultValue={filters.type || ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Tümü</option>
                {facets.types.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Misafir Sayısı</label>
              <select name="guests" defaultValue={filters.guests ? String(filters.guests) : ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Farketmez</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}+ misafir
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Min $</label>
                <input name="minPrice" type="number" defaultValue={filters.min_price} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Max $</label>
                <input name="maxPrice" type="number" defaultValue={filters.max_price} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="seaView" value="1" defaultChecked={filters.sea_view} className="h-4 w-4" />
              Sadece deniz manzaralı
            </label>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Sıralama</label>
              <select name="sort" defaultValue={filters.sort} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="code">Daire Kodu</option>
                <option value="price_asc">Fiyat (Artan)</option>
                <option value="price_desc">Fiyat (Azalan)</option>
                <option value="rating">Puan</option>
              </select>
            </div>

            <button className="w-full rounded-lg bg-[#0071c2] px-4 py-2 font-semibold text-white hover:bg-[#003580]">
              Filtrele
            </button>
            <Link href="/search" className="block text-center text-sm text-slate-500 hover:underline">
              Filtreleri temizle
            </Link>
          </form>
        </aside>

        {/* RESULTS */}
        <div>
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              Kriterlere uygun müsait daire bulunamadı. Filtreleri değiştirmeyi deneyin.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((apt) => (
                <ApartmentCard key={apt.id} apt={apt} checkIn={filters.check_in} checkOut={filters.check_out} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
