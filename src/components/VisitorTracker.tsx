"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useParams, usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();
  const params = useParams();

  useEffect(() => {
    // Admin sayfalarında takip yapmayalım
    if (pathname?.startsWith('/admin')) return;

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    // IP benzeri tekil bir cihaz/tarayıcı kimliği oluştur (Local Storage)
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = 'vis_' + Math.random().toString(36).substr(2, 15);
      localStorage.setItem('visitor_id', visitorId);
    }

    // Session ID hem dynamic route'dan hem query string'den gelebilir.
    const routeSessionId = params?.id as string | undefined;
    const querySessionId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("session") ?? undefined
        : undefined;
    const sessionId = routeSessionId || querySessionId;

    // "online_visitors" kanalına Presence ile bağlan
    const channel = supabase.channel('online_visitors', {
      config: {
        presence: {
          key: visitorId,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      // Sync tetiklendi
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Bağlandığında kendini aktif olarak bildir
        await channel.track({
          online_at: new Date().toISOString(),
          pathname,
          sessionId: sessionId || null
        });

        // IP adresini kaydetmek için API'ye istek at
        if (sessionId) {
          fetch('/api/track-ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          }).catch(console.error);
        }
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pathname, params]);

  return null;
}
