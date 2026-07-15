"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { usePathname } from "next/navigation";

type ChatMessage = {
  id: string;
  session_id: string;
  sender: "user" | "admin";
  message: string;
  image_url?: string | null;
  created_at: string;
};

export function ChatWidget({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(isOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const supabase = createBrowserSupabaseClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-live-chat", handleOpenChat);
    return () => window.removeEventListener("open-live-chat", handleOpenChat);
  }, []);

  // Eğer kullanıcı live-support sayfasına gelirse sohbeti otomatik aç
  // (Artık otomatik açılmıyor, butona basması gerekiyor)
  // useEffect(() => {
  //   if (pathname?.includes("/live-support")) {
  //     setIsOpen(true);
  //   }
  // }, [pathname]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (!supabase) return;

    // Load initial messages
    supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          
          if (!isOpenRef.current && newMsg.sender === "admin") {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !supabase) return;

    const msg = newMessage.trim();
    setNewMessage("");

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender: "user",
      message: msg,
    });
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex h-[80vh] max-h-[600px] w-[90vw] sm:w-[400px] flex-col overflow-hidden rounded-3xl bg-white/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white animate-in zoom-in-95 duration-300">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 bg-white/60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="Support" 
                  className="size-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-800 text-[15px] leading-tight">Sarah Müller</h3>
                <span className="text-[12px] text-gray-500">Kundenservice</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsOpen(false)} title="Minimieren" className="flex size-8 items-center justify-center rounded-full bg-gray-100/80 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors shadow-sm border border-gray-200/50">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button onClick={() => setIsOpen(false)} title="Schließen" className="flex size-8 items-center justify-center rounded-full bg-gray-100/80 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors shadow-sm border border-gray-200/50">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
              {messages.length === 0 ? (
                <p className="text-center text-xs text-gray-500 mt-10">Keine Nachrichten. Wie können wir Ihnen helfen?</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-3xl px-5 py-3 text-[15px] shadow-sm ${m.sender === "user" ? "bg-[#003b8f] text-white rounded-br-sm" : "bg-white/90 text-gray-800 rounded-bl-sm border border-gray-200"}`}>
                      {m.image_url && (
                        <div 
                          className="mb-2 overflow-hidden rounded-xl cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setZoomedImage(m.image_url!)}
                        >
                          <img src={m.image_url} alt="Chat Attachment" className="max-h-48 w-full object-cover" />
                        </div>
                      )}
                      {m.message && <p>{m.message}</p>}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 bg-white/60 backdrop-blur-md border-t border-gray-200/60 pb-4 sm:pb-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nachricht schreiben..."
                className="flex-1 bg-white/90 rounded-full px-5 py-3.5 text-[15px] text-gray-800 outline-none placeholder:text-gray-400 border border-gray-200 focus:border-[#003b8f]/50 transition-colors shadow-sm"
              />
              <button type="submit" disabled={!newMessage.trim()} className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#003b8f] text-white transition-colors hover:bg-[#002f72] disabled:opacity-50 disabled:bg-gray-300 shadow-md">
                <svg className="size-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Overlay */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/70 hover:text-white p-2" 
            onClick={() => setZoomedImage(null)}
          >
            <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed" 
            className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
