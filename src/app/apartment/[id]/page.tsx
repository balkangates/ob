import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Gallery } from "@/components/Gallery";
import { BookingWidget } from "@/components/BookingWidget";
import { ReviewForm } from "@/components/ReviewForm";
import { ApartmentCard } from "@/components/ApartmentCard";
import { StarRating, ScoreBadge } from "@/components/StarRating";
import { getApartmentDetail, getSimilar } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { id: string };
type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const apt = await getApartmentDetail(Number(id));
  if (!apt) return { title: "Daire bulunamadı" };
  return {
    title: `${apt.name} — ${apt.code}`,
    description: apt.description.slice(0, 155),
    openGraph: { images: [apt.cover_image], title: apt.name, description: apt.description.slice(0, 155) },
  };
}

export default async function ApartmentPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const apt = await getApartmentDetail(Number(id));
  if (!apt) notFound();

  const [user, similar] = await Promise.all([getCurrentUser(), getSimilar(apt.type_code, apt.id, 4)]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: apt.name,
    description: apt.description,
    image: apt.images,
    numberOfRooms: apt.bedrooms,
    floorSize: { "@type": "QuantitativeValue", value: apt.size_sqm, unitCode: "MTK" },
    aggregateRating:
      apt.review_count > 0
        ? { "@type": "AggregateRating", ratingValue: apt.rating, reviewCount: apt.review_count }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* breadcrumb */}
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:underline">Ana Sayfa</Link> ·{" "}
        <Link href="/search" className="hover:underline">Daireler</Link> ·{" "}
        <span className="text-slate-700">{apt.code}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium uppercase tracking-wide text-[#0071c2]">{apt.type_name}</div>
          <h1 className="text-2xl font-extrabold text-slate-800 md:text-3xl">{apt.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            📍 Blok {apt.block_code} · {apt.floor}. Kat · {apt.size_sqm} m² · {apt.code}
          </p>
        </div>
        <ScoreBadge value={apt.rating} count={apt.review_count} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <Gallery images={apt.images} alt={apt.name} />

          {/* highlights */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon="👥" label="Kapasite" value={`${apt.max_guests} kişi`} />
            <Stat icon="🛏️" label="Yatak Odası" value={apt.bedrooms > 0 ? `${apt.bedrooms}` : "Stüdyo"} />
            <Stat icon="🚿" label="Banyo" value={`${apt.bathrooms}`} />
            <Stat icon="📐" label="Alan" value={`${apt.size_sqm} m²`} />
          </div>

          <Section title="Açıklama">
            <p className="leading-relaxed text-slate-600">{apt.description}</p>
          </Section>

          <Section title="Olanaklar">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {apt.amenities.map((a) => (
                <div key={a.name} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-lg">{a.icon}</span> {a.name}
                </div>
              ))}
            </div>
          </Section>

          {apt.tour_360_url && (
            <Section title="360° Sanal Tur & Video">
              <div className="grid gap-4 md:grid-cols-2">
                <iframe
                  src={apt.tour_360_url}
                  className="aspect-video w-full rounded-lg border border-slate-200"
                  allowFullScreen
                  title="360 tur"
                />
                <iframe
                  src={apt.video_url}
                  className="aspect-video w-full rounded-lg border border-slate-200"
                  allowFullScreen
                  title="video"
                />
              </div>
            </Section>
          )}

          <Section title="Ev Kuralları">
            <ul className="space-y-1 text-sm text-slate-600">
              {apt.rules.split("·").map((r, i) => (
                <li key={i}>• {r.trim()}</li>
              ))}
            </ul>
          </Section>

          {/* Reviews */}
          <Section title={`Değerlendirmeler (${apt.review_count})`}>
            <div className="mb-4">
              <ReviewForm apartmentId={apt.id} canReview={!!user} />
            </div>
            <div className="space-y-4">
              {apt.reviews.length === 0 && <p className="text-sm text-slate-500">Henüz değerlendirme yok.</p>}
              {apt.reviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{r.author_name}</span>
                    <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
                  </div>
                  <StarRating value={r.rating} />
                  <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Booking */}
        <div>
          <BookingWidget
            apartmentId={apt.id}
            basePrice={apt.base_price}
            maxGuests={apt.max_guests}
            defaultCheckIn={str(sp.checkIn)}
            defaultCheckOut={str(sp.checkOut)}
            user={user ? { full_name: user.full_name, email: user.email, phone: user.phone, genius_level: user.genius_level } : null}
          />
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <Section title="Benzer Daireler">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => (
              <ApartmentCard key={s.id} apt={s} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
      <div className="text-xl">{icon}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold text-slate-800">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-extrabold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}
