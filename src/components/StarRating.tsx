export function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const full = Math.round(value);
  const cls = size === "md" ? "text-lg" : "text-sm";
  return (
    <span className={`inline-flex ${cls} text-amber-400`} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= full ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export function ScoreBadge({ value, count }: { value: number; count?: number }) {
  const label =
    value >= 4.7 ? "Mükemmel" : value >= 4.3 ? "Harika" : value >= 3.8 ? "Çok İyi" : value > 0 ? "İyi" : "Yeni";
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-lg rounded-bl-none bg-[#003580] px-2 py-1 text-sm font-bold text-white">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        {count !== undefined && <div className="text-xs text-slate-500">{count} değerlendirme</div>}
      </div>
    </div>
  );
}
