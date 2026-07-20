"use client";

import { useState, useEffect } from "react";

export function UsersTab({ darkMode }: { darkMode: boolean }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Kullanıcılar alınamadı.");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          username: newUsername,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Kullanıcı eklenemedi.");
      }
      setShowAddModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewUsername("");
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Silme başarısız.");
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Kullanıcı Yönetimi</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Admin kullanıcılarını yönetin</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#EB5E28] text-white rounded-lg font-bold hover:bg-[#c94d1e] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Yeni Kullanıcı Ekle
        </button>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">{error}</div>}

      <div className={`rounded-xl border shadow-sm overflow-hidden ${darkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase border-b ${darkMode ? 'bg-[#2a2a2a] text-gray-400 border-white/10' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              <tr>
                <th className="px-6 py-4">Kullanıcı Adı</th>
                <th className="px-6 py-4">E-posta</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4">Oluşturulma</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center opacity-50">Yükleniyor...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center opacity-50">Kullanıcı bulunamadı.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className={`${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 font-bold">{u.username}</td>
                    <td className="px-6 py-4 opacity-80">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'super_admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                        {u.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.status === 'active' ? 'bg-teal-500/10 text-teal-500' : 'bg-red-500/10 text-red-500'}`}>
                        {u.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 opacity-60">
                      {new Date(u.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.email !== 'admin@example.com' && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${darkMode ? 'bg-[#1e1e1e] border border-white/10' : 'bg-white'}`}>
            <h3 className="text-xl font-bold mb-6">Yeni Kullanıcı Ekle</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Kullanıcı Adı (Linkler için kullanılır)</label>
                <input 
                  type="text" 
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-100 border border-gray-300 focus:border-[#EB5E28]'}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">E-posta</label>
                <input 
                  type="email" 
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className={`w-full p-3 rounded-lg text-sm outline-none ${darkMode ? 'bg-[#121212] text-white border border-zinc-700 focus:border-[#EB5E28]' : 'bg-gray-100 border border-gray-300 focus:border-[#EB5E28]'}`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Şifre</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
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
