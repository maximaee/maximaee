"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function GeneralSettingsTab({ darkMode }: { darkMode: boolean }) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
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
      .update({
        logo_url: settings.logo_url,
        bg_url: settings.bg_url,
        portal_name: settings.portal_name,
        support_center_name: settings.support_center_name,
        wheel_settings: settings.wheel_settings
      })
      .eq("id", settings.id || "default");
    
    setSaving(false);
    if (error) alert("Hata: " + error.message);
    else alert("Genel ayarlar başarıyla kaydedildi!");
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (!e.target.files || e.target.files.length === 0 || !supabase) return;
    const file = e.target.files[0];
    setUploading(key);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `general/${fileName}`;

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Genel Ayarlar</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sitenin genel tasarımını, logo ve arkaplanını değiştirin</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className={`p-6 rounded-xl border shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-6 border-b pb-2 ${darkMode ? 'border-white/10 text-[#EB5E28]' : 'border-gray-200 text-[#EB5E28]'}`}>Marka ve Tasarım</h3>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start border-b border-white/5 pb-6">
              <div className="w-24 h-24 shrink-0 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-2 overflow-hidden">
                {settings.logo_url ? <img src={settings.logo_url} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-xs opacity-50">Logo Yok</span>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-bold opacity-70 uppercase tracking-wider">Site Logosu</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={settings.logo_url || ""}
                    onChange={e => handleChange("logo_url", e.target.value)}
                    className={`flex-1 p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-50 border border-gray-300 focus:border-[#EB5E28]'}`}
                  />
                  <label className={`px-4 py-3 rounded-lg font-bold text-sm cursor-pointer transition-colors ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    {uploading === "logo_url" ? "..." : "Yükle"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, "logo_url")} disabled={!!uploading} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start border-b border-white/5 pb-6">
              <div className="w-24 h-24 shrink-0 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-2 overflow-hidden relative">
                {settings.bg_url ? <img src={settings.bg_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <span className="text-xs opacity-50">Arkaplan Yok</span>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-bold opacity-70 uppercase tracking-wider">Site Arkaplan Görseli (Masaüstü / Genel)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={settings.bg_url || ""}
                    onChange={e => handleChange("bg_url", e.target.value)}
                    className={`flex-1 p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-50 border border-gray-300 focus:border-[#EB5E28]'}`}
                  />
                  <label className={`px-4 py-3 rounded-lg font-bold text-sm cursor-pointer transition-colors ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    {uploading === "bg_url" ? "..." : "Yükle"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, "bg_url")} disabled={!!uploading} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start border-b border-white/5 pb-6">
              <div className="w-24 h-24 shrink-0 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-2 overflow-hidden relative">
                {settings.wheel_settings?.bg_url_mobile ? <img src={settings.wheel_settings.bg_url_mobile} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <span className="text-xs opacity-50">Mobil Yok</span>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-bold opacity-70 uppercase tracking-wider">Site Arkaplan Görseli (Mobil - Opsiyonel)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={settings.wheel_settings?.bg_url_mobile || ""}
                    onChange={e => {
                      setSettings((prev: any) => ({
                        ...prev,
                        wheel_settings: { ...(prev.wheel_settings || {}), bg_url_mobile: e.target.value }
                      }));
                    }}
                    className={`flex-1 p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-50 border border-gray-300 focus:border-[#EB5E28]'}`}
                  />
                  <label className={`px-4 py-3 rounded-lg font-bold text-sm cursor-pointer transition-colors ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    {uploading === "bg_url_mobile" ? "..." : "Yükle"}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0 || !supabase) return;
                      const file = e.target.files[0];
                      setUploading("bg_url_mobile");
                      const fileExt = file.name.split('.').pop();
                      const fileName = `mobile_bg_${Math.random()}.${fileExt}`;
                      const filePath = `general/${fileName}`;
                      const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file);
                      if (uploadError) {
                        alert("Yükleme hatası: " + uploadError.message);
                        setUploading(null);
                        return;
                      }
                      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(filePath);
                      setSettings((prev: any) => ({
                        ...prev,
                        wheel_settings: { ...(prev.wheel_settings || {}), bg_url_mobile: urlData.publicUrl }
                      }));
                      setUploading(null);
                    }} disabled={!!uploading} />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70 uppercase tracking-wider">Portal Adı</label>
                <input 
                  type="text"
                  value={settings.portal_name || ""}
                  onChange={e => handleChange("portal_name", e.target.value)}
                  className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-50 border border-gray-300 focus:border-[#EB5E28]'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70 uppercase tracking-wider">Destek Merkezi Adı</label>
                <input 
                  type="text"
                  value={settings.support_center_name || ""}
                  onChange={e => handleChange("support_center_name", e.target.value)}
                  className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-50 border border-gray-300 focus:border-[#EB5E28]'}`}
                />
              </div>
            </div>

          </div>
        </div>
        
        <div className="flex justify-end sticky bottom-6 z-10">
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-3 bg-[#EB5E28] text-white rounded-lg font-bold hover:bg-[#c94d1e] transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Kaydediliyor..." : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Kaydet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
