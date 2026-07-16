"use client";

import { BankConfig } from "@/lib/banks-db";
import { DEFAULT_DESIGN_CONFIG, BlockType } from "@/lib/bank-design-schema";

export function DynamicBankPreview({ bank }: { bank: BankConfig }) {
  if (!bank) return null;
  const design = bank.design || DEFAULT_DESIGN_CONFIG;

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