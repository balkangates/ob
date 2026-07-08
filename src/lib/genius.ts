// =================================================================
// ORBI LIFE Rewards — Sadakat programı seviyeleri
// Silver: 2 rez → %10 | Gold: 5 rez → %15 | Platinum: 10 rez → %20
// =================================================================
export type GeniusTier = {
  level: number; name: string;
  min_reservations: number; discount_percent: number; perks: string[];
};

export const GENIUS_TIERS: GeniusTier[] = [
  { level: 0, name: "Explorer",  min_reservations: 0,  discount_percent: 0,  perks: ["Standart fiyatlar"] },
  { level: 1, name: "Silver",    min_reservations: 2,  discount_percent: 10, perks: ["%10 indirim"] },
  { level: 2, name: "Gold",      min_reservations: 5,  discount_percent: 15, perks: ["%15 indirim", "Geç çıkış"] },
  { level: 3, name: "Platinum",  min_reservations: 10, discount_percent: 20, perks: ["%20 indirim", "VIP karşılama", "Ücretsiz havalimanı transferi"] },
];

export function levelFromReservations(count: number): number {
  let level = 0;
  for (const t of GENIUS_TIERS) { if (count >= t.min_reservations) level = t.level; }
  return level;
}

export function tierFor(level: number): GeniusTier {
  return GENIUS_TIERS.find((t) => t.level === level) ?? GENIUS_TIERS[0];
}

export function geniusDiscountPercent(level: number): number {
  return tierFor(level).discount_percent;
}
