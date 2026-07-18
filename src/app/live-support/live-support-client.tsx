"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import { Linkify } from "@/components/ui/Linkify";

export function LiveSupportClient({ sessionId }: { sessionId: string }) {
  const { settings } = useSettings();
  
  return (
    <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
      <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-6 sm:p-10 relative z-10 fade-in text-center flex flex-col items-center">
        <div className="mb-6 size-20 sm:size-24 rounded-full bg-white/5 ring-4 ring-white/5 flex items-center justify-center">
          <svg className="size-10 sm:size-12 text-[#0066CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">{settings.live_support_title}</h2>
        <p className="text-sm sm:text-base text-gray-300 mb-8 sm:mb-10 max-w-sm leading-relaxed px-2 whitespace-pre-line font-medium">
          <Linkify text={settings.live_support_subtitle} />
        </p>
        
        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-live-chat"));
          }}
          className="animate-pulse w-full max-w-xs flex flex-col items-center text-white font-bold text-lg cursor-pointer bg-gradient-to-r from-[#0066CC] to-[#0088FF] px-8 py-4 rounded-xl shadow-[0_0_15px_rgba(0,102,204,0.4)] transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <span>{settings.live_support_button}</span>
          <svg className="size-6 sm:size-8 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
