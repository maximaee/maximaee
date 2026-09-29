"use client";

import { useSettings } from "@/contexts/SettingsContext";

const DEFAULT_BG = "/maxima-bg-ee.png";

function isBadBgUrl(u: string | undefined | null): boolean {
  if (!u) return true;
  const s = String(u).trim();
  if (s.length < 8) return true;
  if (s.includes("text_to_image")) return true;
  if (s.includes("coresg-normal.trae.ai")) return true;
  if (s.toLowerCase().includes("the image is generating")) return true;
  return false;
}

export function GlobalBackgroundLayer() {
  const { settings } = useSettings();
  const pageBgs = (settings.wheel_settings?.page_backgrounds || {}) as Record<string, string>;

  let chosen: string = settings.bg_url || DEFAULT_BG;
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
          if (el.src && el.src !== DEFAULT_BG && !el.src.endsWith(DEFAULT_BG)) {
            el.src = DEFAULT_BG;
          }
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020b22]/40 via-[#020b22]/65 to-[#020b22]/90" />
    </div>
  );
}
