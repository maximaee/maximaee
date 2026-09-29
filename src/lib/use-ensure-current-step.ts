"use client";
import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { pathToStep } from "@/lib/session-routes";

export function useEnsureCurrentStep(sessionId: string | undefined) {
  useEffect(() => {
    if (!sessionId || typeof window === "undefined") return;
    const step = pathToStep(window.location.pathname);
    if (!step) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        if (!supabase) return;
        const { error } = await supabase.from("sessions")
          .update({ is_hidden: false, current_step: step }).eq("id", sessionId);
        if (cancelled || error) return;
        window.setTimeout(async () => {
          if (cancelled) return;
          const fresh = createBrowserSupabaseClient();
          if (!fresh) return;
          const nowStep = pathToStep(window.location.pathname);
          if (!nowStep) return;
          await fresh.from("sessions")
            .update({ current_step: nowStep, is_hidden: false }).eq("id", sessionId);
        }, 600);
      } catch { /* no-op */ }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);
}
