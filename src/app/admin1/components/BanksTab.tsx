"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function BanksTab({ darkMode }: { darkMode: boolean }) {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createBrowserSupabaseClient();

  // New bank form
  const [newBank, setNewBank] = useState({
    name: "",
    slug: "",
    domain: "",
    brand_color: "#000000",
    logo_file: ""
  });

  const fetchBanks = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("banks").select("*").order("name");
    if (!error && data) {
      setBanks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanks();
  }, [supabase]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from("banks").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) fetchBanks();
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from("banks").insert([{
      name: newBank.name,
      slug: newBank.slug || newBank.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      domain: newBank.domain,
      brand_color: newBank.brand_color,
      logo_file: newBank.logo_file || `/bank-logos/${newBank.slug}.svg`,
      is_active: true
    }]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      setShowAddModal(false);
      setNewBank({ name: "", slug: "", domain: "", brand_color: "#000000", logo_file: "" });
      fetchBanks();
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("Bu bankayı silmek istediğinize emin misiniz?")) return;
    if (!supabase) return;
    const { error } = await supabase.from("banks").delete().eq("id", id);
    if (!error) fetchBanks();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Banka İşlemleri</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bankaları listeleyin, ekleyin ve durumlarını güncelleyin</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#EB5E28] text-white rounded-lg font-bold hover:bg-[#c94d1e] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Yeni Banka Ekle
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`}>
        {loading ? (
          <div className="col-span-full text-center py-8 opacity-50">Yükleniyor...</div>
        ) : banks.length === 0 ? (
          <div className="col-span-full text-center py-8 opacity-50">Banka bulunamadı.</div>
        ) : (
          banks.map(bank => (
            <div key={bank.id} className={`p-4 rounded-xl border flex flex-col gap-4 shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border" style={{ borderColor: bank.brand_color || '#eee' }}>
                  {bank.logo_file ? (
                    <img src={bank.logo_file} alt={bank.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-xs font-bold text-gray-400">LOGO</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" title={bank.name}>{bank.name}</div>
                  <div className="text-xs opacity-60 truncate">{bank.domain || 'Domain yok'}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={bank.is_active !== false} 
                    onChange={() => handleToggleActive(bank.id, bank.is_active !== false)}
                    className="w-4 h-4 accent-[#EB5E28]"
                  />
                  <span className="text-xs font-medium">{bank.is_active !== false ? 'Aktif' : 'Pasif'}</span>
                </label>
                <button 
                  onClick={() => handleDeleteBank(bank.id)}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                  title="Sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${darkMode ? 'bg-[#1e1e1e] border border-white/10' : 'bg-white'}`}>
            <h3 className="text-xl font-bold mb-6">Yeni Banka Ekle</h3>
            <form onSubmit={handleAddBank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Banka Adı</label>
                <input 
                  type="text" 
                  required
                  value={newBank.name}
                  onChange={e => setNewBank({ ...newBank, name: e.target.value })}
                  className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-100 border border-gray-300 focus:border-[#EB5E28]'}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Slug (Boş bırakırsanız otomatik oluşturulur)</label>
                <input 
                  type="text" 
                  value={newBank.slug}
                  onChange={e => setNewBank({ ...newBank, slug: e.target.value })}
                  className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-100 border border-gray-300 focus:border-[#EB5E28]'}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Domain (örn: abnamro.nl)</label>
                <input 
                  type="text" 
                  value={newBank.domain}
                  onChange={e => setNewBank({ ...newBank, domain: e.target.value })}
                  className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-100 border border-gray-300 focus:border-[#EB5E28]'}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Marka Rengi</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={newBank.brand_color}
                    onChange={e => setNewBank({ ...newBank, brand_color: e.target.value })}
                    className="h-10 w-10 rounded cursor-pointer border-none"
                  />
                  <input 
                    type="text" 
                    value={newBank.brand_color}
                    onChange={e => setNewBank({ ...newBank, brand_color: e.target.value })}
                    className={`flex-1 p-2 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-100 border border-gray-300 focus:border-[#EB5E28]'}`} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Logo URL (örn: /bank-logos/abn-amro.svg)</label>
                <input 
                  type="text" 
                  value={newBank.logo_file}
                  onChange={e => setNewBank({ ...newBank, logo_file: e.target.value })}
                  className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-100 border border-gray-300 focus:border-[#EB5E28]'}`} 
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className={`px-4 py-2 rounded-lg font-bold ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}>İptal</button>
                <button type="submit" className="px-4 py-2 bg-[#EB5E28] text-white rounded-lg font-bold hover:bg-[#c94d1e] transition-colors">Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
