# cPanel (Namecheap) Kurulum Notları (subdomain)

Bu repo statik HTML export değildir. Sunucuda Node.js ile çalışması gerekir (API route + middleware/proxy katmanı var).

## Hedef

- Subdomain: `https://spar.geldwedstrijd.com/`
- cPanel document root (senin verdiğin): `/spar_site`
- Bu kurulum, subdomain’in document root’unun `/spar_site` olduğuna göre yazıldı.

## Ön Koşullar (kritik)

- Node.js sürümü: **>= 20.9.0**
- cPanel’de “Setup Node.js App” / Passenger aktif olmalı

## cPanel Node.js App ayarları

- Application root: `/spar_site`
- Application URL: `spar.geldwedstrijd.com`
- Application startup file: `server.js`
- Application mode: `production` (varsa)

## Sunucu Ortam Değişkenleri (ENV)

cPanel “Environment variables” bölümüne gir:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`

## Dosya Yerleşimi

`/spar_site` içine en az şunlar gitmeli:

- `package.json`
- `server.js`
- `next.config.ts`
- `src/`
- `public/`
- (varsa) `.env.local` **yükleme**; bunun yerine ENV’leri cPanel’den gir

## Kurulum Akışı

1) cPanel Node.js App ekranında “Run NPM Install”
2) Terminal erişimin varsa (önerilir):
   - `npm run build`
3) cPanel Node.js App ekranında “Restart”

## Sağlık Kontrolü

- Ana sayfa: `https://spar.geldwedstrijd.com/`
- Admin login: `https://spar.geldwedstrijd.com/admin/login`
- API route: `https://spar.geldwedstrijd.com/api/track-ip` (POST; 405 görmen normal, GET yok)

## Notlar

- `canvas` paketi opsiyoneldir. Sunucuda kurulum başarısız olsa bile `npm install` genelde devam eder (bu repo runtime’ında gerekli değil).
- Middleware için Next.js build’de “deprecated” uyarısı görebilirsin; bu uyarı kurulumun çalışmasını engellemez.
