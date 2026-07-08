# Orbi City Batumi — Supabase + Vercel Kurulum Rehberi

Bu proje Next.js 16 + Drizzle ORM ile yazılmıştır ve veritabanı olarak
**Supabase Postgres**'i kullanır (Drizzle, doğrudan Postgres connection
string üzerinden bağlanır — Supabase JS client yalnızca Storage/Realtime
için kullanılır).

Supabase projesi: `https://ctuelacvhpeomcleaofi.supabase.co`

---

## 1) Supabase tarafında yapılacaklar

### 1.1 Veritabanı şemasını kur
Supabase Dashboard → **SQL Editor** → yeni sorgu → `supabase/migration.sql`
dosyasının tamamını yapıştırıp **Run** edin.

Bu işlem:
- `orbi_supabase_table.txt` içindeki minimal/uyumsuz tabloları siler
  (eğer varsa) ve projenin gerçek Drizzle şemasına göre 15 tabloyu kurar
  (`users`, `sessions`, `blocks`, `apartment_types`, `amenities`,
  `facilities`, `apartments`, `apartment_images`, `apartment_amenities`,
  `pricing_rules`, `coupons`, `reservations`, `reviews`, `notifications`,
  `genius_levels`).
- Genius seviyesi ve apartman puanı için **otomatik trigger**'ları kurar
  (`fn_recalculate_genius_level`, `fn_recalculate_apartment_rating`).
- Tüm tablolarda **RLS** açar; vitrin tabloları (apartments, blocks,
  reviews vb.) public okumaya açıktır, yazma işlemleri yalnızca uygulamanın
  server-side bağlantısı (Drizzle, doğrudan Postgres) üzerinden yapılır.
- `apartment-media` adlı **Storage bucket**'ı oluşturur (public read).
- `reservations`, `notifications`, `apartments` tablolarını **Realtime**
  publication'a ekler.

> ⚠️ **DİKKAT:** Bu script mevcut `users`, `reservations` vb. tabloları
> **DROP** eder. Eğer Supabase projenizde gerçek/canlı veri varsa önce
> yedek alın. Yeni/boş bir proje için sorun yoktur.

### 1.2 Veritabanı şifresini alın
Supabase Dashboard → **Project Settings → Database → Connection string**
→ **Connection pooling** sekmesi → **Transaction** modu → URI'yi kopyalayın.

Format şuna benzer:
```
postgresql://postgres.ctuelacvhpeomcleaofi:[ŞİFRENİZ]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

`[ŞİFRENİZ]` kısmı projeyi oluştururken belirlediğiniz veritabanı
şifresidir (Database Password). Hatırlamıyorsanız aynı sayfadan
**Reset database password** ile yenileyebilirsiniz.

> Neden **Transaction pooler** (port 6543) ve **Session/Direct** (port
> 5432) değil? Vercel serverless fonksiyonları her istekte yeni bağlantı
> açabilir; Direct mode bağlantı limitini hızla doldurur. Transaction
> pooler (pgBouncer) bu sorunu çözer ve Drizzle'ın `node-postgres`
> adaptörüyle (prepared statement kullanmadığı için) tam uyumludur.

### 1.3 Service Role Key'i alın (Storage yazma için)
Supabase Dashboard → **Project Settings → API** → `service_role` (secret)
anahtarını kopyalayın. Bu anahtar admin panelden apartman görseli/video
yüklerken kullanılır (`src/lib/supabase.ts → uploadApartmentMedia`).

---

## 2) Ortam değişkenleri (.env.local)

`.env.example` dosyasını `.env.local` olarak kopyalayıp doldurun:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://postgres.ctuelacvhpeomcleaofi:[ŞİFRENİZ]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://ctuelacvhpeomcleaofi.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
SUPABASE_SERVICE_ROLE_KEY="<service_role anahtarınız>"
```

`NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` zaten bu
projeye özel olarak doldurulmuştur (paylaştığınız değerler), değiştirmenize
gerek yok.

---

## 3) Şemayı veritabanına uygula + örnek veri

```bash
npm install

# Drizzle şemasını doğrudan Supabase'e push et (migration dosyaları
# olmadan, schema.ts'i temel alarak tabloları senkronize eder).
# NOT: supabase/migration.sql'i adım 1.1'de zaten çalıştırdıysanız
# bu adımı atlayabilirsiniz — ikisi de aynı şemayı kurar.
npm run db:push

# 150 apartman + bloklar + tipler + olanaklar + kuponlar + demo
# kullanıcılarla veritabanını doldurur.
npm run db:seed
```

Demo hesaplar (seed sonrası):
- 🛠️ Admin: `admin@orbicity.com` / `admin123`
- 👤 Misafir: `guest@orbicity.com` / `guest123`

---

## 4) Yerel geliştirme

```bash
npm run dev
```

`http://localhost:3000` adresinde açılır. `/api/health` endpoint'i
veritabanı bağlantısını test eder (`{"ok":true}` dönmeli).

---

## 5) Vercel'e deploy

### 5.1 Repo'yu Vercel'e bağlayın
GitHub/GitLab'a push edin, ardından Vercel Dashboard → **Add New Project**
→ repo'yu seçin → Framework otomatik **Next.js** olarak algılanır.

### 5.2 Environment Variables ekleyin
Vercel Project → **Settings → Environment Variables** içine
(Production + Preview + Development hepsine) şunları ekleyin:

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler URI'niz |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ctuelacvhpeomcleaofi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (verdiğiniz anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role anahtarınız |

### 5.3 Deploy
**Deploy** butonuna basın. `vercel.json` zaten `next build` komutunu ve
Frankfurt (`fra1`) bölgesini (Supabase'e en yakın AWS eu-central-1
pooler'a düşük gecikme için) tanımlar.

Build tek seferde geçer; `npm run db:seed` deploy adımına **dahil
değildir** — bunu yalnızca bir kez, yerel makinenizden veya Vercel CLI
(`vercel env pull` sonrası `npm run db:seed`) ile elle çalıştırmanız
gerekir.

---

## 6) Mimari özet (AI Development Memory referansı)

- **Tablolar/kolonlar**: `src/db/schema.ts` kalıcı referanstır,
  `supabase/migration.sql` bununla birebir senkronizedir. Değiştirmeyin.
- **Auth**: Custom cookie-session (`orbi_session`), `scrypt` ile şifre
  hash'leme. Supabase Auth **kullanılmıyor** — bu, Server Actions ile
  tam entegre, ekstra bağımlılık gerektirmeyen bir model olduğu için
  tercih edildi. `users` / `sessions` tabloları bu modeli destekler.
- **Supabase JS SDK** (`src/lib/supabase.ts`) yalnızca Storage (apartman
  medyası) ve gelecekteki Realtime özellikleri için kullanılır; tüm CRUD
  işlemleri Drizzle ORM üzerinden Postgres'e gider.
- **Genius / Rating hesaplama**: Hem uygulama katmanında
  (`src/lib/actions.ts`) hem de veritabanı trigger'larında
  (`fn_recalculate_genius_level`, `fn_recalculate_apartment_rating`)
  çift güvenceli olarak yapılır — uygulama dışından (örn. admin panel
  doğrudan SQL ile rezervasyon eklerse) tutarlılık bozulmaz.
- **Dosya/route yapısı**: Next.js App Router konvansiyonu korunmuştur,
  hiçbir dosya yeniden adlandırılmamıştır.

---

## 7) Sorun giderme

**"DATABASE_URL is required" hatası**
`.env.local` dosyasının proje kök dizininde olduğundan ve `DATABASE_URL`
satırının dolu olduğundan emin olun.

**"too many connections" / pooler hatası**
`DATABASE_URL`'in port **6543** (Transaction pooler) kullandığından emin
olun, **5432** (Direct connection) değil.

**Build geçiyor ama sayfalar boş geliyor**
Veritabanı boş demektir — `npm run db:seed` çalıştırılmamış olabilir.

**Görseller yüklenmiyor**
Seed verisi Pexels CDN linklerini kullanır, harici bir bağımlılık
gerektirmez. Admin panelden yeni görsel yüklemek isterseniz
`SUPABASE_SERVICE_ROLE_KEY`'in doğru ve Storage bucket'ının
(`apartment-media`) oluşturulmuş olduğundan emin olun.
