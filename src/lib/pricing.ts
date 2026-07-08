// =================================================================
// ORBI LIFE — Fiyatlandırma hesaplama (saf fonksiyonlar, DB yok)
// Şu an sabit fiyat kullanılıyor. Dinamik kural istenirse
// Supabase'e pricing_rules tablosu eklenip buraya bağlanabilir.
// =================================================================

export function nightsBetweenDates(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn  + "T00:00:00Z");
  const b = new Date(checkOut + "T00:00:00Z");
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}
