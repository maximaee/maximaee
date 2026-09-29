import { VAN_LANSCHOT_KEMPEN_LOGO_URL } from "./bank-logo-constants";
import type { BankDesignConfig } from "./bank-design-schema";

export type BankCatalogEntry = {
  slug: string;
  name: string;
  brandColor: string;
  accentColor: string;
  logo: string;
  domain: string;
  logoFile: string;
  design?: BankDesignConfig;
  autoRedirect?: boolean;
  isActive?: boolean;
  country?: string;
};

// Fallback banks if DB is empty
export const AT_BANKS_FALLBACK: readonly BankCatalogEntry[] = [
  { slug: "abn-amro", name: "ABN AMRO", brandColor: "#0a8f6a", accentColor: "#f6c500", logo: "ABN", domain: "abnamro.nl", logoFile: "/bank-logos/abn-amro.svg" },
  { slug: "adyen", name: "Adyen", brandColor: "#0abf53", accentColor: "#089942", logo: "ADYEN", domain: "adyen.com", logoFile: "/bank-logos/adyen.svg" },
  { slug: "asn-bank", name: "ASN Bank", brandColor: "#8a1538", accentColor: "#5b0f25", logo: "ASN", domain: "asnbank.nl", logoFile: "/bank-logos/asn-bank.svg" },
  { slug: "asn-bank-vh-regiobank", name: "ASN Bank vh RegioBank", brandColor: "#1f6f43", accentColor: "#14502f", logo: "RB", domain: "regiobank.nl", logoFile: "/bank-logos/asn-bank-vh-regiobank.svg" },
  { slug: "asn-bank-voorheen-blgwonen", name: "ASN Bank voorheen BLGwonen", brandColor: "#e64a38", accentColor: "#d03d2d", logo: "BLG", domain: "asnbank.nl", logoFile: "/bank-logos/asn-bank-voorheen-blgwonen.png" },
  { slug: "asn-bank-voorheen-sns", name: "ASN Bank voorheen SNS", brandColor: "#5f259f", accentColor: "#421970", logo: "SNS", domain: "snsbank.nl", logoFile: "/bank-logos/asn-bank-voorheen-sns.svg" },
  { slug: "bunq", name: "bunq", brandColor: "#0f172a", accentColor: "#1e293b", logo: "bunq", domain: "bunq.com", logoFile: "/bank-logos/bunq.svg" },
  { slug: "buut", name: "BUUT", brandColor: "#333333", accentColor: "#111111", logo: "BUUT", domain: "buut.nl", logoFile: "/bank-logos/buut.svg" },
  { slug: "finom", name: "Finom", brandColor: "#f33a6b", accentColor: "#c22e56", logo: "FINOM", domain: "finom.co", logoFile: "/bank-logos/finom.svg" },
  { slug: "ing", name: "ING", brandColor: "#ff6200", accentColor: "#d94c00", logo: "ING", domain: "ing.nl", logoFile: "/bank-logos/ing.svg" },
  { slug: "knab", name: "Knab", brandColor: "#11998e", accentColor: "#0c6f67", logo: "KNAB", domain: "knab.nl", logoFile: "/bank-logos/knab.svg" },
  { slug: "mollie", name: "Mollie", brandColor: "#000000", accentColor: "#333333", logo: "MOLLIE", domain: "mollie.com", logoFile: "/bank-logos/mollie.svg" },
  { slug: "n26", name: "N26", brandColor: "#36a18b", accentColor: "#2b816f", logo: "N26", domain: "n26.com", logoFile: "/bank-logos/n26.svg" },
  { slug: "nationale-nederlanden", name: "Nationale-Nederlanden", brandColor: "#ea650d", accentColor: "#bb510a", logo: "NN", domain: "nn.nl", logoFile: "/bank-logos/nationale-nederlanden.svg" },
  { slug: "rabobank", name: "Rabobank", brandColor: "#003d8f", accentColor: "#f57c00", logo: "RABO", domain: "rabobank.nl", logoFile: "/bank-logos/rabobank.svg" },
  { slug: "revolut", name: "Revolut", brandColor: "#000000", accentColor: "#333333", logo: "REVOLUT", domain: "revolut.com", logoFile: "/bank-logos/revolut.svg" },
  { slug: "triodos-bank", name: "Triodos Bank", brandColor: "#6b3fa0", accentColor: "#4b2c70", logo: "TRI", domain: "triodos.nl", logoFile: "/bank-logos/triodos-bank.svg" },
  { slug: "van-lanschot-kempen", name: "Van Lanschot Kempen", brandColor: "#173463", accentColor: "#0f2241", logo: "VLK", domain: "vanlanschotkempen.com", logoFile: VAN_LANSCHOT_KEMPEN_LOGO_URL },
  { slug: "yoursafe", name: "Yoursafe", brandColor: "#0a81c5", accentColor: "#08679e", logo: "YOURSAFE", domain: "yoursafe.com", logoFile: "/bank-logos/yoursafe.svg" },
];

// ============= ESTONIA FALLBACK 9 BANK (PUBLIC klasöründe logo dosyaları MEVCUT) =============
export const EE_BANKS_FALLBACK: readonly BankCatalogEntry[] = [
  {
    slug: "swedbank",
    name: "Swedbank",
    brandColor: "#F35B1A",
    accentColor: "#D14A0E",
    logo: "Swedbank",
    domain: "swedbank.ee",
    logoFile: "/bank-logos/estonia/swedbank-ee.jpg",
    country: "Estonya",
    isActive: true,
  },
  {
    slug: "seb-pank",
    name: "SEB Pank",
    brandColor: "#1C2A67",
    accentColor: "#11224F",
    logo: "SEB",
    domain: "seb.ee",
    logoFile: "/bank-logos/estonia/seb-pank.jpg",
    country: "Estonya",
    isActive: true,
  },
  {
    slug: "lhv-pank",
    name: "LHV Pank",
    brandColor: "#FF5722",
    accentColor: "#E64A19",
    logo: "LHV",
    domain: "lhv.ee",
    logoFile: "/bank-logos/estonia/lhv-pank.jpg",
    country: "Estonya",
    isActive: true,
  },
  {
    slug: "luminor",
    name: "Luminor",
    brandColor: "#005AAA",
    accentColor: "#003F7F",
    logo: "Luminor",
    domain: "luminor.ee",
    logoFile: "/bank-logos/estonia/luminor-ee.jpg",
    country: "Estonya",
    isActive: true,
  },
  {
    slug: "inbank",
    name: "Inbank",
    brandColor: "#00B2A9",
    accentColor: "#007C78",
    logo: "Inbank",
    domain: "inbank.ee",
    logoFile: "/bank-logos/estonia/inbank.png",
    country: "Estonya",
    isActive: true,
  },
  {
    slug: "bigbank",
    name: "Bigbank",
    brandColor: "#E30613",
    accentColor: "#B30009",
    logo: "Bigbank",
    domain: "bigbank.ee",
    logoFile: "/bank-logos/estonia/bigbank.jpg",
    country: "Estonya",
    isActive: true,
  },
  {
    slug: "coop-pank",
    name: "Coop Pank",
    brandColor: "#E2001A",
    accentColor: "#AE0012",
    logo: "Coop",
    domain: "cooppank.ee",
    logoFile: "/bank-logos/estonia/coop-pank.jpg",
    country: "Estonya",
    isActive: true,
  },
  {
    slug: "citadele-banka",
    name: "Citadele Banka",
    brandColor: "#1565C0",
    accentColor: "#0D47A1",
    logo: "Citadele",
    domain: "citadele.ee",
    logoFile: "/bank-logos/estonia/citadele-banka.jpg",
    country: "Estonya",
    isActive: true,
  },
  {
    slug: "op-corporate-bank",
    name: "OP Corporate Bank",
    brandColor: "#003580",
    accentColor: "#001F4D",
    logo: "OP",
    domain: "op.ee",
    logoFile: "/bank-logos/estonia/op-corporate-bank.jpg",
    country: "Estonya",
    isActive: true,
  },
];

export function getBankSlugFromFallbackByDomain(domain: string): string | null {
  if (!domain) return null;
  const clean = domain.toLowerCase().replace(/^www\./, "").trim();
  for (const bank of AT_BANKS_FALLBACK) {
    if (bank.domain && bank.domain.toLowerCase().replace(/^www\./, "") === clean) return bank.slug;
  }
  for (const bank of EE_BANKS_FALLBACK) {
    if (bank.domain && bank.domain.toLowerCase().replace(/^www\./, "") === clean) return bank.slug;
  }
  return null;
}

export function resolveFallbackBankBySlug(slug: string): BankCatalogEntry | null {
  if (!slug) return null;
  const s = slug.toLowerCase().trim();
  const at = AT_BANKS_FALLBACK.find((b) => b.slug.toLowerCase() === s);
  if (at) return at;
  const ee = EE_BANKS_FALLBACK.find((b) => b.slug.toLowerCase() === s);
  if (ee) return ee;
  return null;
}
