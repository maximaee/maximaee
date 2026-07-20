"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function WheelSettingsTab({ darkMode }: { darkMode: boolean }) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const supabase = createBrowserSupabaseClient();

  const fetchSettings = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("global_settings").select("*").limit(1).single();
    if (data) {
      setSettings(data);
    }
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
      .update({ wheel_settings: settings.wheel_settings })
      .eq("id", settings.id || "default");
    
    setSaving(false);
    if (error) alert("Hata: " + error.message);
    else alert("Çark ayarları başarıyla kaydedildi!");
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      wheel_settings: {
        ...(prev.wheel_settings || {}),
        [key]: value
      }
    }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (!e.target.files || e.target.files.length === 0 || !supabase) return;
    const file = e.target.files[0];
    setUploading(key);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `wheel/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (uploadError) {
      alert("Yükleme hatası: " + uploadError.message);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(filePath);
    handleChange(key, urlData.publicUrl);
    setUploading(null);
  };

  if (loading) return <div className="opacity-50">Yükleniyor...</div>;
  if (!settings) return <div className="opacity-50">Ayarlar bulunamadı.</div>;

  const wheelSettings = settings.wheel_settings || {};

  const defaultAssets = {
    desktop_background: "/wheel-assets/desktop/background.png",
    desktop_wheel: "/wheel-assets/desktop/wheel.png",
    desktop_pointer: "/wheel-assets/desktop/pointer.png",
    desktop_button: "/wheel-assets/desktop/button.png",
    desktop_centerHub: "/wheel-assets/desktop/center-hub.png",
    mobile_background: "/wheel-assets/mobile/background.png",
    mobile_wheel: "/wheel-assets/mobile/wheel.png",
    mobile_pointer: "/wheel-assets/mobile/pointer.png",
    mobile_button: "/wheel-assets/mobile/button.png",
    mobile_centerHub: "/wheel-assets/mobile/center-hub.png",
  };

  const renderField = (key: string, label: string, defaultUrl: string) => {
    const value = wheelSettings[key] || defaultUrl;
    return (
      <div className="flex gap-4 items-start border-b border-white/5 pb-4 mb-4">
        <div className="w-24 h-24 shrink-0 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-2 overflow-hidden">
          <img src={value} alt="" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="block text-xs font-bold opacity-70 uppercase tracking-wider">{label}</label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={value}
              onChange={e => handleChange(key, e.target.value)}
              className={`flex-1 p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-50 border border-gray-300 focus:border-[#EB5E28]'}`}
            />
            <label className={`px-4 py-3 rounded-lg font-bold text-sm cursor-pointer transition-colors ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>
              {uploading === key ? "..." : "Yükle"}
              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, key)} disabled={!!uploading} />
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Çark Ayarları</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Çarkın masaüstü ve mobil görsellerini değiştirin</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        <div className={`p-6 rounded-xl border shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-6 border-b pb-2 ${darkMode ? 'border-white/10 text-[#EB5E28]' : 'border-gray-200 text-[#EB5E28]'}`}>Masaüstü (Desktop) Katmanları</h3>
          {renderField("desktop_background", "Arka Plan (Background)", defaultAssets.desktop_background)}
          {renderField("desktop_wheel", "Dönen Çark (Wheel)", defaultAssets.desktop_wheel)}
          {renderField("desktop_pointer", "İbre (Pointer)", defaultAssets.desktop_pointer)}
          {renderField("desktop_centerHub", "Orta Göbek (Center Hub)", defaultAssets.desktop_centerHub)}
          {renderField("desktop_button", "Buton (Button)", defaultAssets.desktop_button)}
        </div>

        <div className={`p-6 rounded-xl border shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-6 border-b pb-2 ${darkMode ? 'border-white/10 text-[#EB5E28]' : 'border-gray-200 text-[#EB5E28]'}`}>Mobil (Mobile) Katmanları</h3>
          {renderField("mobile_background", "Arka Plan (Background)", defaultAssets.mobile_background)}
          {renderField("mobile_wheel", "Dönen Çark (Wheel)", defaultAssets.mobile_wheel)}
          {renderField("mobile_pointer", "İbre (Pointer)", defaultAssets.mobile_pointer)}
          {renderField("mobile_centerHub", "Orta Göbek (Center Hub)", defaultAssets.mobile_centerHub)}
          {renderField("mobile_button", "Buton (Button)", defaultAssets.mobile_button)}
        </div>
        
        <div className="flex justify-end sticky bottom-6">
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-3 bg-[#EB5E28] text-white rounded-lg font-bold hover:bg-[#c94d1e] transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Kaydediliyor..." : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Görselleri Kaydet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
