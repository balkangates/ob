// =================================================================
// ORBI LIFE — Basit CSV Parser (bağımlılıksız)
// Tırnak içindeki virgülleri ve çift tırnak kaçışlarını ("") destekler.
// =================================================================

/** Tek bir CSV satırını hücrelere ayırır. */
function parseLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

/**
 * CSV metnini, ilk satırı başlık kabul ederek nesne dizisine çevirir.
 * Boş satırlar atlanır. Başlıklar trim + lowercase yapılır.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalized.split("\n").filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];

  const headers = parseLine(rawLines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const cells = parseLine(rawLines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

/** "evet"/"hayır"/"1"/"true" gibi değerleri boolean'a çevirir. */
export function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "evet" || v === "1" || v === "true" || v === "yes" || v === "e";
}

/** Sayısal alanlar için güvenli dönüştürme (boşsa fallback döner). */
export function parseNumber(value: string | undefined, fallback: number): number {
  if (!value || value.trim() === "") return fallback;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}
