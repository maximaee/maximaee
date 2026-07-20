import { createServerSupabaseClient } from "./supabase/server";
import type { BankDesignConfig } from "./bank-design-schema";
import { VAN_LANSCHOT_KEMPEN_LOGO_URL } from "./bank-logo-constants";

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

export async function getBanks(): Promise<BankConfig[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  
  const { data } = await supabase
    .from("banks")
    .select("*");

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
      autoRedirect: b.autoRedirect || false
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
    logo: b.logo,
    domain: b.domain,
    logo_file: b.logoFile,
    design_config: b.design,
    is_active: b.isActive !== false,
    country: b.country || "Hollanda",
    autoRedirect: b.autoRedirect || false
  }));

  // Perform an upsert on the 'slug' column
  const { error } = await supabase
    .from("banks")
    .upsert(payload, { onConflict: 'slug' });
    
  if (error) {
    console.error("Error updating banks:", error);
    throw error;
  }
}
