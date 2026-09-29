"use client";

import type { ReactNode } from "react";
import { useSettings } from "@/contexts/SettingsContext";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function DemoShell({ children, title, subtitle }: Props) {
  const { settings } = useSettings();
  const safeBgUrl = (() => {
    const raw = settings.bg_url || "";
    if (!raw) return "/maxima-bg-ee.png";
    if (raw.includes("text_to_image") || raw.includes("coresg-normal.trae.ai") || raw.trim().length < 6) {
      return "/maxima-bg-ee.png";
    }
    return raw;
  })();

  return (
    <div className="min-h-screen flex flex-col text-zinc-900 relative overflow-hidden">
      <img
        src={safeBgUrl}
        aria-hidden
        alt=""
        className="pointer-events-none absolute inset-0 -z-[1] h-full w-full object-cover select-none"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/maxima-bg-ee.png"; }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1] bg-gradient-to-b from-white/50 via-white/60 to-white/80 backdrop-blur-[2px]"
      />
      <header className="fixed top-0 left-0 w-full h-[80px] sm:h-[106px] z-[10000] border-b border-white/35 bg-white/55 shadow-sm backdrop-blur-xl flex items-center">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center shrink-0">
              <img src={settings.logo_url} alt="Logo" className="h-10 sm:h-18 w-auto object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{settings.portal_name}</p>
              <p className="text-[14px] sm:text-lg font-semibold leading-none text-[#003b8f] whitespace-nowrap">{settings.support_center_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-[100px] sm:pt-[124px] pb-8 fade-in">
        {(title || subtitle) && (
          <div className="mb-8 space-y-2 text-center">
            {title ? <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1> : null}
            {subtitle ? <p className="text-sm font-medium text-zinc-600">{subtitle}</p> : null}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
