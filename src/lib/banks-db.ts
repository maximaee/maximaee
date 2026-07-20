import { unstable_cache, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase/server";
import type { BankDesignConfig } from "./bank-design-schema";
import { VAN_LANSCHOT_KEMPEN_LOGO_URL } from "./bank-logo-constants";

const BANKS_CACHE_TAG = "banks";
const BANKS_CACHE_REVALIDATE_SECONDS = 3600; // 1 saat

export type BankConfig = {
  slug: string;
  name: string;
  brandColor: string;
  accentColor: string;
  logo: string;
  domain: string;
  logoFile: string;
  description?: string;
  contactInfo?: string;
  design?: BankDesignConfig;
  autoRedirect?: boolean;
  isActive?: boolean;
  country?: string;
};

const BANKS_SESSION_ID = "00000000-0000-0000-0000-000000000000";

function applyBankOverrides(bank: BankConfig): BankConfig {
  if (bank.slug !== "van-lanschot-kempen") {
    return bank;
  }

  return {
    ...bank,
    logoFile: VAN_LANSCHOT_KEMPEN_LOGO_URL,
  };
}

// unstable_cache içinde cookies() kullanan Supabase server client çağrılamaz
// (request-scoped dynamic API). Bu yüzden cache'lenen sorgu için cookie'siz,
// yalnızca env değişkenlerine bağlı basit bir Supabase client kullanıyoruz.
function createCacheableSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const getCachedBanksRaw = unstable_cache(
  async (): Promise<any[]> => {
    const supabase = createCacheableSupabaseClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from("banks")
      .select("*");

    return data ?? [];
  },
  ["banks-catalog"],
  {
    tags: [BANKS_CACHE_TAG],
    revalidate: BANKS_CACHE_REVALIDATE_SECONDS,
  },
);

export async function getBanks(): Promise<BankConfig[]> {
  const data = await getCachedBanksRaw();

  if (data && data.length > 0) {
    return data.map((b: any) => applyBankOverrides({
      slug: b.slug,
      name: b.name,
      brandColor: b.brand_color || b.brandColor,
      accentColor: b.accent_color || b.accentColor,
      logo: b.logo,
      domain: b.domain,
      logoFile: b.logo_file || b.logoFile,
      design: b.design_config || b.design,
      isActive: b.is_active !== false,
      country: b.country || "Hollanda",
      autoRedirect: b.auto_redirect || false
    }));
  }
  return [];
}

export async function updateBanks(banks: BankConfig[]) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  
  // Update each bank individually or upsert them
  const payload = banks.map(applyBankOverrides).map(b => ({
    slug: b.slug,
    name: b.name,
    brand_color: b.brandColor,
    accent_color: b.accentColor,
    domain: b.domain,
    logo_file: b.logoFile,
    design_config: b.design,
    is_active: b.isActive !== false,
    country: b.country || "Hollanda",
    auto_redirect: b.autoRedirect || false
  }));

  // Perform an upsert on the 'slug' column
  const { error } = await supabase
    .from("banks")
    .upsert(payload, { onConflict: 'slug' });
    
  if (error) {
    console.error("Error updating banks:", error);
    throw error;
  }

  // Banks güncellendi, cache'i geçersiz kıl ki değişiklikler hemen yansısın
  revalidateTag(BANKS_CACHE_TAG);
}
