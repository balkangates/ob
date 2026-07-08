import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { money, formatDate } from "@/lib/format";
import { GENIUS_TIERS } from "@/lib/genius";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = supabaseAdmin();
  const { data: reservations } = await sb
    .from("reservations")
    .select("id, reference, check_in, check_out, nights, total_price, status, payment_status, apartments(code, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const tier = GENIUS_TIERS.find((t) => t.level === user.genius_level) ?? GENIUS_TIERS[0];
  const nextTier = GENIUS_TIERS.find((t) => t.level === user.genius_level + 1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {/* Profil */}
      <div className="rounded-2xl bg-gradient-to-br from-[#003580] to-[#0071c2] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/70">Orbi Life Hesabım</div>
            <h1 className="text-2xl font-extrabold">{user.full_name || "Merhaba"}</h1>
            <div className="text-sm text-white/80">{user.email}</div>
          </div>
          <div className="text-right">
            <div className="rounded-full bg-amber-400 px-3 py-1 text-sm font-extrabold text-[#003580]">
              {tier.name}
            </div>
            {tier.discount_percent > 0 && (
              <div className="mt-1 text-sm text-amber-300">%{tier.discount_percent} indirim aktif</div>
            )}
          </div>
        </div>
        {nextTier && (
          <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm">
            <span className="font-semibold">{nextTier.name}</span> için
            {" "}{nextTier.min_reservations - user.total_reservations} rezervasyon daha gerekli.
          </div>
        )}
      </div>

      {/* Rezervasyonlar */}
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-slate-800">Rezervasyonlarım</h2>
        {!reservations?.length ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            <p>Henüz rezervasyonunuz yok.</p>
            <Link href="/search" className="mt-3 inline-block text-sm font-semibold text-[#0071c2] hover:underline">
              Daire Ara →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => {
              const res = r as unknown as {
                id: number; reference: string; check_in: string; check_out: string;
                nights: number; total_price: number; status: string; payment_status: string;
                apartments: { code: string; name: string } | null;
              };
              const statusColor: Record<string, string> = {
                pending: "bg-yellow-100 text-yellow-700",
                confirmed: "bg-green-100 text-green-700",
                cancelled: "bg-red-100 text-red-600",
                checked_in: "bg-blue-100 text-blue-700",
                checked_out: "bg-slate-100 text-slate-600",
              };
              return (
                <div key={res.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/reservation/${res.reference}`} className="font-mono font-bold text-[#0071c2] hover:underline">
                        {res.reference}
                      </Link>
                      <div className="mt-1 text-sm font-semibold text-slate-700">{res.apartments?.name ?? res.apartments?.code}</div>
                      <div className="text-sm text-slate-500">{res.check_in} → {res.check_out} · {res.nights} gece</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-800">{money(Number(res.total_price))}</div>
                      <div className="mt-1 flex gap-2 justify-end">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[res.status] ?? "bg-slate-100"}`}>{res.status}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${res.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                          {res.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Genius Seviyeleri */}
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-slate-800">Orbi Life Rewards</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {GENIUS_TIERS.filter((t) => t.level > 0).map((t) => (
            <div key={t.level} className={`rounded-xl border p-4 ${user.genius_level >= t.level ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}>
              <div className="font-extrabold text-slate-800">{t.name}</div>
              <div className="text-sm text-slate-500">{t.min_reservations}+ rezervasyon</div>
              <div className="mt-2 text-2xl font-bold text-[#003580]">%{t.discount_percent}</div>
              <ul className="mt-2 text-xs text-slate-600 space-y-1">
                {t.perks.map((p) => <li key={p}>✓ {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Çıkış */}
      <form action={logoutAction}>
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50">
          Çıkış Yap
        </button>
      </form>
    </div>
  );
}
