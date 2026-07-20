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
    .from("sessions")
    .select("form_data")
    .eq("id", BANKS_SESSION_ID)
    .maybeSingle();

  if (data?.form_data?.banks) {
    return (data.form_data.banks as BankConfig[]).map(applyBankOverrides);
  }
  return [];
}

export async function updateBanks(banks: BankConfig[]) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  
  // Update the special session record
  await supabase
    .from("sessions")
    .update({
      form_data: { banks: banks.map(applyBankOverrides) }
    })
    .eq("id", BANKS_SESSION_ID);
}
