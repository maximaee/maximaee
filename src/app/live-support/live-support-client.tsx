"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";

export function LiveSupportClient({ sessionId }: { sessionId: string }) {
  const { settings } = useSettings();
  
  return (
    <div className="relative flex-1 w-full overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 text-center"
         style={{
           backgroundImage: `url("${settings.bg_url}")`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat',
         }}>
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 size-20 sm:size-24 rounded-full bg-[#d8e8fb] flex items-center justify-center shadow-inner">
          <svg className="size-10 sm:size-12 text-[#003b8f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#003b8f] mb-3">{settings.live_support_title}</h2>
        <p className="text-sm sm:text-base text-gray-700 mb-8 sm:mb-10 max-w-sm leading-relaxed px-2 whitespace-pre-line">
          {settings.live_support_subtitle}
        </p>
        
        <button 
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-live-chat"));
          }}
          className="animate-bounce flex flex-col items-center text-[#003b8f] font-semibold text-sm sm:text-base cursor-pointer bg-white/80 px-8 py-4 rounded-3xl shadow-lg backdrop-blur-md border border-white/50 hover:bg-white hover:scale-105 transition-all"
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
