export type BankCatalogEntry = {
  slug: string;
  name: string;
  brandColor: string;
  accentColor: string;
  logo: string;
  domain: string;
  logoFile: string;
};

function buildBankIconDataUri(label: string, background: string, foreground = "#ffffff") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="28" fill="${background}"/>
      <text x="64" y="73" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="${foreground}">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AT_BANKS: readonly BankCatalogEntry[] = [
  { slug: "ing", name: "ING", brandColor: "#ff6200", accentColor: "#d94c00", logo: "ING", domain: "ing.nl", logoFile: buildBankIconDataUri("ING", "#ff6200") },
  { slug: "rabobank", name: "Rabobank", brandColor: "#003d8f", accentColor: "#f57c00", logo: "RABO", domain: "rabobank.nl", logoFile: buildBankIconDataUri("R", "#003d8f") },
  { slug: "abn-amro", name: "ABN AMRO", brandColor: "#0a8f6a", accentColor: "#f6c500", logo: "ABN", domain: "abnamro.nl", logoFile: buildBankIconDataUri("ABN", "#0a8f6a") },
  { slug: "asn-bank", name: "ASN Bank", brandColor: "#8a1538", accentColor: "#5b0f25", logo: "ASN", domain: "asnbank.nl", logoFile: buildBankIconDataUri("ASN", "#8a1538") },
  { slug: "sns", name: "SNS", brandColor: "#5f259f", accentColor: "#421970", logo: "SNS", domain: "snsbank.nl", logoFile: buildBankIconDataUri("SNS", "#5f259f") },
  { slug: "regiobank", name: "RegioBank", brandColor: "#1f6f43", accentColor: "#14502f", logo: "RB", domain: "regiobank.nl", logoFile: buildBankIconDataUri("RB", "#1f6f43") },
  { slug: "bunq", name: "bunq", brandColor: "#0f172a", accentColor: "#1e293b", logo: "bunq", domain: "bunq.com", logoFile: buildBankIconDataUri("b", "#0f172a") },
  { slug: "triodos", name: "Triodos Bank", brandColor: "#6b3fa0", accentColor: "#4b2c70", logo: "TRI", domain: "triodos.nl", logoFile: buildBankIconDataUri("TRI", "#6b3fa0") },
  { slug: "knab", name: "Knab", brandColor: "#11998e", accentColor: "#0c6f67", logo: "KNAB", domain: "knab.nl", logoFile: buildBankIconDataUri("K", "#11998e") },
  { slug: "van-lanschot-kempen", name: "Van Lanschot Kempen", brandColor: "#173463", accentColor: "#0f2241", logo: "VLK", domain: "vanlanschotkempen.com", logoFile: buildBankIconDataUri("VLK", "#173463") },
] as const;

export function getBankBySlug(slug: string): BankCatalogEntry | null {
  return AT_BANKS.find((bank) => bank.slug === slug) ?? null;
}
