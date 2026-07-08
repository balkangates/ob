import Link from "next/link";

export function Footer() {
  return (
    <footer id="contact" className="mt-16 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3 text-lg font-extrabold text-white">🏙️ Orbi City Batumi</div>
          <p className="text-sm text-slate-400">
            Sherif Khimshiashvili St, Batumi, Gürcistan. A-B-C blokları, 150+ bağımsız daire, tek tesis rezervasyon
            motoru.
          </p>
        </div>
        <div>
          <div className="mb-3 font-semibold text-white">Keşfet</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/search" className="hover:text-white">Tüm Daireler</Link></li>
            <li><Link href="/search?seaView=1" className="hover:text-white">Deniz Manzaralı</Link></li>
            <li><Link href="/#facilities" className="hover:text-white">Tesis Olanakları</Link></li>
            <li><Link href="/#genius" className="hover:text-white">Genius Loyalty</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-semibold text-white">Hesap</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/account" className="hover:text-white">Rezervasyonlarım</Link></li>
            <li><Link href="/login" className="hover:text-white">Giriş Yap</Link></li>
            <li><Link href="/register" className="hover:text-white">Kayıt Ol</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-semibold text-white">İletişim</div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>📞 +995 555 000 000</li>
            <li>✉️ reservations@orbicity.com</li>
            <li>🕐 Resepsiyon 24/7</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Orbi City Batumi Booking Engine. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
