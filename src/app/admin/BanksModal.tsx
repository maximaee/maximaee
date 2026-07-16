"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { BankConfig } from "@/lib/banks-db";
import { BankDesignConfig, DEFAULT_DESIGN_CONFIG, BlockType } from "@/lib/bank-design-schema";
import { DynamicBankPreview } from "./DynamicBankPreview";

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
      if (data.banks) {
        // A-Z Sıralama (Alphabetical sort)
        const sorted = data.banks.sort((a: BankConfig, b: BankConfig) => a.name.localeCompare(b.name));
        setBanks(sorted);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function saveAll(newBanks: BankConfig[]) {
    setSaving(true);
    try {
      // Sort before saving
      const sorted = newBanks.sort((a, b) => a.name.localeCompare(b.name));
      await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banks: sorted }),
      });
      setBanks(sorted);
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

  async function handleReferenceImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingBank || !supabase) return;

    setAiAnalyzing(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ref-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('assets').upload(fileName, file, { upsert: true });
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(fileName);
      const imageUrl = publicUrlData.publicUrl;

      // Send to AI for full design analysis
      const res = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (data.design) {
        setEditingBank({ ...editingBank, design: data.design });
        alert("Yapay zeka tasarımı başarıyla oluşturdu!");
      }
    } catch (err: any) {
      alert("Yapay zeka analizi başarısız oldu: " + err.message);
    }
    setAiAnalyzing(false);
  }

  function updateDesign(updater: (prev: BankDesignConfig) => BankDesignConfig) {
    if (!editingBank) return;
    const currentDesign = editingBank.design || DEFAULT_DESIGN_CONFIG;
    setEditingBank({ ...editingBank, design: updater(currentDesign) });
  }

  // Drag and Drop handlers for blocks
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    updateDesign(d => {
      const newBlocks = [...d.blocks];
      const [removed] = newBlocks.splice(draggedIdx, 1);
      newBlocks.splice(index, 0, removed);
      return { ...d, blocks: newBlocks };
    });
    setDraggedIdx(null);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[95vw] rounded-2xl border border-zinc-800 bg-[#111111] p-6 shadow-2xl h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4 shrink-0">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🏦 Banka Listesi ve Tasarımı
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">AI Tasarım Motoru</span>
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">✕</button>
        </div>
        
        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Sol: Banka Listesi */}
          <div className="w-1/4 flex flex-col border-r border-zinc-800 pr-6 overflow-hidden">
            <button 
              onClick={() => {
                setIsNew(true);
                setEditingBank({ slug: "", name: "", brandColor: "#000000", accentColor: "#333333", logo: "", domain: "", logoFile: "", design: DEFAULT_DESIGN_CONFIG });
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: Düzenleyici ve Önizleme */}
          <div className="w-3/4 flex gap-6 overflow-hidden">
            {!editingBank ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <div className="text-4xl mb-4">🎨</div>
                <p>Düzenlemek için soldan bir banka seçin veya yeni ekleyin.</p>
              </div>
            ) : (
              <>
                {/* Ayarlar Paneli */}
                <div className="w-1/2 overflow-y-auto pr-4 space-y-6 pb-20">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-white">{isNew ? "Yeni Banka Oluştur" : "Bankayı Düzenle"}</h4>
                    {!isNew && (
                      <button onClick={() => handleDeleteBank(editingBank.slug)} className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1 rounded bg-red-500/10">Bankayı Sil</button>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30">
                    <h5 className="font-bold text-purple-300 mb-2 flex items-center gap-2">✨ AI ile Otomatik Tasarım Üret</h5>
                    <p className="text-xs text-purple-200/70 mb-4">Bir bankanın ekran görüntüsünü veya referans tasarımını yükleyin. AI tüm renkleri, mizanpajı ve metinleri analiz edip çalışır bir tasarım çıkarsın.</p>
                    <label className={`flex items-center justify-center w-full p-3 rounded-lg border-2 border-dashed ${aiAnalyzing ? 'border-purple-500 bg-purple-500/20' : 'border-purple-500/50 hover:bg-purple-500/10'} cursor-pointer transition-all`}>
                      <span className="text-sm font-bold text-purple-300">{aiAnalyzing ? "AI Tasarımı Oluşturuyor..." : "📸 Referans Fotoğraf Yükle"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleReferenceImageUpload} disabled={aiAnalyzing} />
                    </label>
                  </div>

                  {/* Temel Bilgiler */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Banka Adı</label>
                      <input type="text" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" value={editingBank.name} onChange={e => setEditingBank({...editingBank, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Slug</label>
                      <input type="text" disabled={!isNew} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50" value={editingBank.slug} onChange={e => setEditingBank({...editingBank, slug: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Logo URL</label>
                      <input type="text" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" value={editingBank.logoFile} onChange={e => setEditingBank({...editingBank, logoFile: e.target.value})} />
                    </div>
                  </div>

                  {/* Görsel Düzenleyici (Yapısal) */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-white border-b border-zinc-800 pb-2">Mizanpaj & Bloklar (Sürükle Bırak)</h5>
                    <div className="space-y-2">
                      {(editingBank.design?.blocks || DEFAULT_DESIGN_CONFIG.blocks).map((block, idx) => (
                        <div 
                          key={`${block}-${idx}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700 cursor-grab active:cursor-grabbing"
                        >
                          <span className="text-zinc-500">☰</span>
                          <span className="text-sm font-bold text-white uppercase tracking-wider">{block}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-bold text-white border-b border-zinc-800 pb-2">Renkler ve Stiller</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Arkaplan Rengi</label>
                        <input type="color" value={editingBank.design?.background.value || "#ffffff"} onChange={e => updateDesign(d => ({...d, background: {...d.background, value: e.target.value}}))} className="w-full h-8 cursor-pointer rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Form Kutusu Arkaplanı</label>
                        <input type="color" value={editingBank.design?.formBox.backgroundColor || "#ffffff"} onChange={e => updateDesign(d => ({...d, formBox: {...d.formBox, backgroundColor: e.target.value}}))} className="w-full h-8 cursor-pointer rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Buton Rengi</label>
                        <input type="color" value={editingBank.design?.button.backgroundColor || "#000000"} onChange={e => updateDesign(d => ({...d, button: {...d.button, backgroundColor: e.target.value}}))} className="w-full h-8 cursor-pointer rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Buton Yazı Rengi</label>
                        <input type="color" value={editingBank.design?.button.textColor || "#ffffff"} onChange={e => updateDesign(d => ({...d, button: {...d.button, textColor: e.target.value}}))} className="w-full h-8 cursor-pointer rounded" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-bold text-white border-b border-zinc-800 pb-2">Metinler</h5>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Form Başlığı</label>
                      <input type="text" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" value={editingBank.design?.texts.title || ""} onChange={e => updateDesign(d => ({...d, texts: {...d.texts, title: e.target.value}}))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Alt Başlık</label>
                      <input type="text" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" value={editingBank.design?.texts.subtitle || ""} onChange={e => updateDesign(d => ({...d, texts: {...d.texts, subtitle: e.target.value}}))} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 sticky bottom-0 bg-[#111111] py-4 border-t border-zinc-800">
                    <button 
                      onClick={handleSaveBank}
                      disabled={saving}
                      className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
                    >
                      {saving ? "Kaydediliyor..." : "Tasarımı Kaydet"}
                    </button>
                  </div>
                </div>

                {/* Canlı Önizleme */}
                <div className="w-1/2 flex flex-col border border-zinc-800 rounded-xl bg-black overflow-hidden relative">
                  <div className="bg-zinc-900 p-2 text-center text-xs font-bold text-zinc-400 tracking-widest border-b border-zinc-800">
                    CANLI ÖNİZLEME (Gerçek Görünüm)
                  </div>
                  <div className="flex-1 overflow-y-auto relative bg-white">
                    <div className="absolute inset-0 pointer-events-none origin-top" style={{ transform: 'scale(0.8)', width: '125%', height: '125%' }}>
                      <DynamicBankPreview bank={editingBank} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}