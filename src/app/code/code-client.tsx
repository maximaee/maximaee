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
      .update({ current_step: "win" })
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
      router.push(`/win/${encodeURIComponent(sessionId)}`);
    }, 500);
  }

  if (!supabase) return <ConfigMissing />;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[#003b8f] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-zinc-100">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#003b8f]/10 text-[#003b8f] shadow-inner">
          <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>

        <h2 className="mb-3 text-center text-2xl font-bold text-zinc-800">
          {settings.code_title}
        </h2>
        <p className="mb-8 text-center text-[15px] leading-relaxed text-zinc-600">
          {settings.code_subtitle.split("{partner}").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <strong className="text-[#003b8f] font-bold">{partnerName}</strong>}
            </span>
          ))}
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-sm font-bold text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-700 text-left">Deelnamecode</label>
            <input
              type="text"
              required
              className="w-full rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4 text-center text-2xl font-bold tracking-widest text-zinc-800 outline-none focus:border-[#003b8f] focus:bg-white transition-all"
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              placeholder="•••"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={processing}
            className="w-full rounded-2xl bg-[#003b8f] py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#002f72] disabled:opacity-50 disabled:hover:scale-100"
          >
            {processing ? "Verwerken..." : settings.code_button}
          </button>
        </form>
      </div>
    </div>
  );
}
