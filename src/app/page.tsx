import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { ApartmentCard } from "@/components/ApartmentCard";
import { getFeatured, getActiveFacilities, getFacets } from "@/lib/data";
import { GENIUS_TIERS } from "@/lib/genius";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, facilities, facets] = await Promise.all([
    getFeatured(6),
    getActiveFacilities(),
    getFacets(),
  ]);

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero.jpg" alt="Orbi City Batumi" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#003580]/70 via-[#003580]/40 to-[#003580]/80" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white drop-shadow md:text-5xl">
            Orbi City Batumi&apos;de deniz manzaralı dairenizi bulun
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            A, B ve C bloklarında 150+ bağımsız daire. Studio&apos;dan Penthouse&apos;a, anında rezervasyon ve Genius
            sadakat indirimleri.
          </p>
          <div className="mt-8">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/90">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">🏖️ Plaja 200m</span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">🏊 Havuz & Spa</span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">🅿️ Kapalı Otopark</span>
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">🛎️ 24/7 Resepsiyon</span>
          </div>
        </div>
      </section>

      {/* BLOCKS QUICK LINKS */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {facets.blocks.map((b) => (
            <Link
              key={b.id}
              href={`/search?block=${b.code}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0071c2] hover:shadow-md"
            >
              <div className="text-2xl font-extrabold text-[#003580]">Blok {b.code}</div>
              <p className="mt-1 text-sm text-slate-500">{b.description}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-[#0071c2]">Daireleri gör →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Öne Çıkan Daireler</h2>
            <p className="text-sm text-slate-500">En yüksek puanlı deniz manzaralı seçenekler</p>
          </div>
          <Link href="/search" className="text-sm font-semibold text-[#0071c2] hover:underline">
            Tümünü gör →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((apt) => (
            <ApartmentCard key={apt.id} apt={apt} />
          ))}
        </div>
      </section>

      {/* FACILITIES */}
      <section id="facilities" className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-extrabold text-slate-800">Ortak Tesis Olanakları</h2>
          <p className="mt-1 text-sm text-slate-500">Tüm misafirlerimizin kullanımına açık ayrıcalıklar</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {facilities.map((f) => (
              <div key={f.id} className="rounded-xl border border-slate-200 p-4">
                <div className="text-3xl">{f.icon}</div>
                <div className="mt-2 font-bold text-slate-800">{f.name}</div>
                <p className="text-sm text-slate-500">{f.description}</p>
                <div className="mt-2 text-xs font-medium text-[#0071c2]">🕐 {f.hours}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GENIUS */}
      <section id="genius" className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-2xl bg-gradient-to-br from-[#003580] to-[#0071c2] p-8 text-white md:p-12">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-amber-400 px-2 py-1 text-sm font-extrabold text-[#003580]">Genius</span>
            <h2 className="text-2xl font-extrabold">Sadakat Programı</h2>
          </div>
          <p className="mt-2 max-w-2xl text-white/85">
            Daha çok konaklayın, daha çok kazanın. Her rezervasyon sizi bir üst seviyeye taşır ve indirimleriniz
            otomatik uygulanır.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {GENIUS_TIERS.filter((t) => t.level > 0).map((t) => (
              <div key={t.level} className="rounded-xl bg-white/10 p-5 backdrop-blur">
                <div className="text-sm font-semibold text-amber-300">Seviye {t.level}</div>
                <div className="text-3xl font-extrabold">%{t.discount_percent}</div>
                <div className="mt-1 text-sm text-white/80">{t.min_reservations}+ rezervasyon</div>
                <ul className="mt-3 space-y-1 text-sm text-white/90">
                  {t.perks.map((p) => (
                    <li key={p}>✓ {p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
