import { getBanks, getBankBySlugDb } from "./banks-db";
import {
  AT_BANKS_FALLBACK,
  EE_BANKS_FALLBACK,
  resolveFallbackBankBySlug,
} from "./at-bank-catalog-shared";
import type { BankCatalogEntry } from "./at-bank-catalog-shared";
import { normalizeCountryName } from "./country-utils";

// Re-export for back-compat (some imports expect these from this file)
export type { BankCatalogEntry } from "./at-bank-catalog-shared";
export { AT_BANKS_FALLBACK, EE_BANKS_FALLBACK, resolveFallbackBankBySlug };

export async function getBankCatalog(): Promise<BankCatalogEntry[]> {
  const dbBanks = await getBanks();
  if (dbBanks && dbBanks.length > 0) {
    const mapped = dbBanks.map(b => ({
      ...(b as unknown as BankCatalogEntry),
      country: normalizeCountryName(b.country, "Estonya"),
      isActive: b.isActive !== false,
    }));
    const activeForCountry = mapped.filter(
      (b) => b.isActive && b.country === "Estonya",
    );
    if (activeForCountry.length > 0) {
      return mapped;
    }
    return [
      ...mapped,
      ...EE_BANKS_FALLBACK.map((b) => ({ ...b } as BankCatalogEntry)),
    ];
  }
  return EE_BANKS_FALLBACK.map((b) => ({
    ...b,
    country: "Estonya",
    isActive: true,
  } as BankCatalogEntry));
}

export async function getBankBySlug(slug: string): Promise<BankCatalogEntry | null> {
  if (!slug) return null;
  const dbBank = await getBankBySlugDb(slug);

  if (dbBank) {
    return {
      ...(dbBank as unknown as BankCatalogEntry),
      country: normalizeCountryName(dbBank.country, "Estonya"),
      isActive: dbBank.isActive !== false,
    };
  }

  const fallback = resolveFallbackBankBySlug(slug);
  if (fallback) {
    return {
      ...fallback,
      country: fallback.country || "Estonya",
      isActive: fallback.isActive !== false,
    };
  }

  return null;
}
