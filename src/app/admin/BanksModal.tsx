"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type BankConfig = {
  slug: string;
  name: string;
  brandColor: string;
  accentColor: string;
  logo: string;
  domain: string;
  logoFile: string;
};

export function BanksModal({ onClose }: { onClose: () => void }) {
  const supabase = createBrowserSupabaseClient();
  const [banks, setBanks] = useState<BankConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBank, setEditingBank] = useState<BankConfig | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  async function fetchBanks() {
    setLoading(true);
    try {
      const res = await fetch("/api/banks");
      const data = await res.json();
      if (data.banks) setBanks(data.banks);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function saveAll(newBanks: BankConfig[]) {
    setSaving(true);
    try {
      await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banks: newBanks }),
      });
      setBanks(newBanks);
      setEditingBank(null);
    } catch (e) {
      alert("Kaydedilirken hata oluştu!");
    }
    setSaving(false);
  }

  function handleSaveBank() {
    if (!editingBank) return;
    if (!editingBank.slug || !editingBank.name) {
      alert("Slug ve İsim zorunludur!");
      return;
    }
    
    let newBanks = [...banks];
    if (isNew) {
      if (newBanks.find(b => b.slug === editingBank.slug)) {
        alert("Bu slug zaten kullanımda!");
        return;
      }
      newBanks.push(editingBank);
    } else {
      newBanks = newBanks.map(b => b.slug === editingBank.slug ? editingBank : b);
    }
    
    void saveAll(newBanks);
  }

  function handleDeleteBank(slug: string) {
    if (!confirm("Bu bankayı silmek istediğinize emin misiniz?")) return;
    const newBanks = banks.filter(b => b.slug !== slug);
    void saveAll(newBanks);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingBank) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `bank-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('assets').upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(fileName);
      setEditingBank({ ...editingBank, logoFile: publicUrlData.publicUrl });
    } catch (err: any) {
      alert("Logo yüklenirken hata: " + err.message);
    }
  }

  async function analyzeLogoWithAI() {
    if (!editingBank?.logoFile) {
      alert("Lütfen önce bir logo yükleyin veya URL girin.");
      return;
    }
    setAiAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: editingBank.logoFile }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (data.brandColor && data.accentColor) {
        setEditingBank({ ...editingBank, brandColor: data.brandColor, accentColor: data.accentColor });
      }
    } catch (err: any) {
      alert("Yapay zeka analizi başarısız oldu: " + err.message);
    }
    setAiAnalyzing(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-2xl border border-zinc-800 bg-[#111111] p-6 shadow-2xl h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4 shrink-0">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🏦 Banka Listesi ve Tasarımı
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">AI Destekli</span>
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">✕</button>
        </div>
        
        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Sol Taraf: Banka Listesi */}
          <div className="w-1/3 flex flex-col border-r border-zinc-800 pr-6 overflow-hidden">
            <button 
              onClick={() => {
                setIsNew(true);
                setEditingBank({ slug: "", name: "", brandColor: "#000000", accentColor: "#333333", logo: "", domain: "", logoFile: "" });
              }}
              className="mb-4 rounded-xl bg-zinc-800 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              + Yeni Banka Ekle
            </button>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <div className="text-center text-zinc-500 py-10">Yükleniyor...</div>
              ) : banks.map(b => (
                <div 
                  key={b.slug}
                  onClick={() => { setIsNew(false); setEditingBank(b); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${editingBank?.slug === b.slug ? 'bg-blue-900/20 border-blue-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800'}`}
                >
                  <div className="size-8 rounded-full overflow-hidden bg-white shrink-0 flex items-center justify-center p-1">
                    {b.logoFile ? <img src={b.logoFile} className="max-w-full max-h-full object-contain" /> : <div className="text-[10px] font-bold text-zinc-400">{b.logo}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate text-sm">{b.name}</div>
                    <div className="text-xs text-zinc-500 truncate">{b.domain}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ Taraf: Düzenleme Formu */}
          <div className="w-2/3 flex flex-col overflow-y-auto pr-2">
            {!editingBank ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <div className="text-4xl mb-4">🎨</div>
                <p>Düzenlemek için soldan bir banka seçin veya yeni ekleyin.</p>
              </div>
            ) : (
              <div className="space-y-6 pb-10">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-white">{isNew ? "Yeni Banka Oluştur" : "Bankayı Düzenle"}</h4>
                  {!isNew && (
                    <button onClick={() => handleDeleteBank(editingBank.slug)} className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1 rounded bg-red-500/10">Bankayı Sil</button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Banka Adı</label>
                    <input type="text" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" value={editingBank.name} onChange={e => setEditingBank({...editingBank, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Slug (URL için)</label>
                    <input type="text" disabled={!isNew} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50" value={editingBank.slug} onChange={e => setEditingBank({...editingBank, slug: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Kısa Kod (Yazı Logo)</label>
                    <input type="text" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" value={editingBank.logo} onChange={e => setEditingBank({...editingBank, logo: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Domain (Örn: banka.com)</label>
                    <input type="text" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" value={editingBank.domain} onChange={e => setEditingBank({...editingBank, domain: e.target.value})} />
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-zinc-800 bg-[#161616]">
                  <h5 className="font-bold text-white mb-4">Görsel ve Tasarım (Yapay Zeka Destekli)</h5>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Logo URL veya Dosya Yükle</label>
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" value={editingBank.logoFile} onChange={e => setEditingBank({...editingBank, logoFile: e.target.value})} placeholder="https://..." />
                      <label className="cursor-pointer rounded bg-zinc-800 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700">
                        Dosya
                        <input type="file" accept="image/*,.svg" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-6 items-center bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 mb-6">
                    <div className="size-16 shrink-0 bg-white rounded-lg flex items-center justify-center p-2">
                      {editingBank.logoFile ? <img src={editingBank.logoFile} className="max-w-full max-h-full object-contain" /> : <span className="text-zinc-400 text-xs">Logo Yok</span>}
                    </div>
                    
                    <button 
                      onClick={analyzeLogoWithAI}
                      disabled={aiAnalyzing || !editingBank.logoFile}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
                    >
                      {aiAnalyzing ? "Analiz Ediliyor..." : "✨ AI ile Renkleri Çıkar"}
                    </button>
                    <p className="text-xs text-zinc-500 flex-1">Yapay zeka, logodaki marka ve vurgu renklerini otomatik tespit eder.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2">Ana Marka Rengi (Brand)</label>
                      <div className="flex gap-3 items-center">
                        <input type="color" value={editingBank.brandColor} onChange={e => setEditingBank({...editingBank, brandColor: e.target.value})} className="size-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                        <input type="text" value={editingBank.brandColor} onChange={e => setEditingBank({...editingBank, brandColor: e.target.value})} className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white font-mono uppercase" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2">Vurgu Rengi (Accent)</label>
                      <div className="flex gap-3 items-center">
                        <input type="color" value={editingBank.accentColor} onChange={e => setEditingBank({...editingBank, accentColor: e.target.value})} className="size-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                        <input type="text" value={editingBank.accentColor} onChange={e => setEditingBank({...editingBank, accentColor: e.target.value})} className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white font-mono uppercase" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Önizleme */}
                  <div className="mt-6">
                    <label className="block text-xs font-bold text-zinc-500 mb-2">Tasarım Önizlemesi</label>
                    <div className="rounded-xl overflow-hidden border border-zinc-800 flex">
                      <div className="w-1/2 p-6 flex flex-col justify-center items-center text-white" style={{ backgroundColor: editingBank.brandColor }}>
                        <div className="text-lg font-bold mb-2">{editingBank.name}</div>
                        <button className="px-6 py-2 rounded-full text-sm font-bold shadow-lg" style={{ backgroundColor: editingBank.accentColor }}>Giriş Yap</button>
                      </div>
                      <div className="w-1/2 bg-white p-6 flex flex-col justify-center items-center">
                        {editingBank.logoFile ? <img src={editingBank.logoFile} className="h-10 object-contain mb-4" /> : <div className="text-xl font-black mb-4" style={{ color: editingBank.brandColor }}>{editingBank.logo}</div>}
                        <div className="w-full h-2 rounded-full overflow-hidden bg-zinc-200">
                          <div className="h-full w-1/2" style={{ backgroundColor: editingBank.brandColor }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveBank}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
                  >
                    {saving ? "Kaydediliyor..." : "Bankayı Kaydet"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
