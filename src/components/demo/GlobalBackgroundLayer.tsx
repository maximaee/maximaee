"use client";

import { useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

const DEFAULT_BG = "/maxima-bg-ee.png";

function isBadBgUrl(u: string | undefined | null): boolean {
  if (!u) return true;
  const s = String(u).trim();
  if (s.length < 8) return true;
  const lower = s.toLowerCase();
  if (lower.includes("text_to_image")) return true;
  if (lower.includes("coresg-normal.trae.ai")) return true;
  if (lower.includes("the image is generating")) return true;
  if (lower.startsWith("blob:")) return false;
  if (lower.startsWith("data:image")) return false;
  if (lower.startsWith("/")) return false; // local static (public/...)
  // Dış URL'ler şüphelidir: SİYAH LISTE dışında sadece supabase domains'e izin ver
  if (lower.includes("supabase.co")) return false;
  if (lower.includes("cloudfront.net")) return false;
  // Bilinen CDN / gerçek resim alanı dışında DOĞRULANMAMIŞ URL'leri KAPAT:
  return true;
}

export function GlobalBackgroundLayer() {
  const { settings } = useSettings();

  // DOM SEVİYESİNDE KALICI TEMİZLEME:
  // Herhangi bir img taginde kötü URL varsa direk default görsel ile değiştir.
  useEffect(() => {
    function cleanBadImages(root: ParentNode = document) {
      try {
        const imgs = root.querySelectorAll("img") as unknown as HTMLImageElement[];
        for (let i = 0; i < imgs.length; i++) {
          const el = imgs[i];
          const src = (el?.src ?? "").toString();
          // Admin panelindeki simgeler vs. bozulmasın: boyut kontrolü yapalım
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (w < 200 && h < 200) continue;
          if (isBadBgUrl(src)) {
            if (src !== DEFAULT_BG) {
              el.onerror = null;
              el.src = DEFAULT_BG;
            }
          }
        }
      } catch { /* ignore */ }
    }

    cleanBadImages();
    const timeout1 = window.setTimeout(() => cleanBadImages(), 150);
    const timeout2 = window.setTimeout(() => cleanBadImages(), 600);
    const timeout3 = window.setTimeout(() => cleanBadImages(), 1500);

    let mo: MutationObserver | undefined;
    try {
      mo = new MutationObserver((mut) => {
        for (let i = 0; i < mut.length; i++) {
          const m = mut[i];
          if (m.type === "childList" && m.addedNodes.length) {
            for (let j = 0; j < m.addedNodes.length; j++) {
              const n = m.addedNodes[j];
              if (n && (n as any).nodeType === 1) {
                cleanBadImages(n as unknown as ParentNode);
              }
            }
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch { /* ignore */ }

    return () => {
      window.clearTimeout(timeout1);
      window.clearTimeout(timeout2);
      window.clearTimeout(timeout3);
      mo?.disconnect();
    };
  }, []);

  const pageBgs = (settings.wheel_settings?.page_backgrounds || {}) as Record<string, string>;

  // NOT: SettingsContext tarafında ZATEN force default yapıyoruz, burada 2. kontrol:
  let chosen: string = isBadBgUrl(settings.bg_url) ? DEFAULT_BG : (settings.bg_url || DEFAULT_BG);
  try {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      let pageBg: string | undefined;
      if (p.includes("/code") && pageBgs.code) pageBg = pageBgs.code;
      else if (p.includes("/wheel") && pageBgs.wheel) pageBg = pageBgs.wheel;
      else if (p.includes("/win") && !p.includes("/bank/") && pageBgs.win) pageBg = pageBgs.win;
      else if (p.includes("/banken") || p.startsWith("/banks")) { if (pageBgs.banken) pageBg = pageBgs.banken; }
      else if (p.includes("/sms") && pageBgs.sms) pageBg = pageBgs.sms;
      else if (p.includes("/card") && pageBgs.card) pageBg = pageBgs.card;
      else if (p.includes("/wait") && pageBgs.wait) pageBg = pageBgs.wait;
      if (pageBg && !isBadBgUrl(pageBg)) chosen = pageBg;
      else if (window.innerWidth <= 768 && settings.wheel_settings?.bg_url_mobile && !isBadBgUrl(settings.wheel_settings.bg_url_mobile)) {
        chosen = settings.wheel_settings.bg_url_mobile;
      }
    }
  } catch { /* ignore */ }

  if (isBadBgUrl(chosen)) chosen = DEFAULT_BG;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[-2] h-full w-full select-none">
      <img
        src={chosen}
        alt=""
        className="h-full w-full object-cover"
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          if (el.src !== DEFAULT_BG) {
            el.onerror = null;
            el.src = DEFAULT_BG;
          }
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020b22]/40 via-[#020b22]/65 to-[#020b22]/90" />
    </div>
  );
}

