import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { tierFor } from "@/lib/genius";
import { logoutAction } from "@/lib/actions";

export async function Navbar() {
  const user = await getCurrentUser();
  const tier = user ? tierFor(user.genius_level) : null;

  return (
    <header className="sticky top-0 z-40 bg-[#003580] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏙️</span>
          <span className="text-lg font-extrabold tracking-tight">
            Orbi <span className="text-amber-400">Life</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/search"       className="hover:text-amber-300">Daireler</Link>
          <Link href="/#facilities" className="hover:text-amber-300">Tesisler</Link>
          <Link href="/#genius"     className="hover:text-amber-300">Rewards</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {tier && tier.level > 0 && (
                <span className="hidden rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-[#003580] sm:inline">
                  {tier.name} · %{tier.discount_percent}
                </span>
              )}
              {user.role === "admin" && (
                <Link href="/admin" className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
                  Admin
                </Link>
              )}
              <Link href="/account" className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
                {user.full_name.split(" ")[0] || "Hesabım"}
              </Link>
              <form action={logoutAction}>
                <button className="text-sm text-white/70 hover:text-white">Çıkış</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hover:text-amber-300">Giriş</Link>
              <Link
                href="/register"
                className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-[#003580] hover:bg-amber-300"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
