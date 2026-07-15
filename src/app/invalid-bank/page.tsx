import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { InvalidBankClient } from "./invalid-bank-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function InvalidBankPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <InvalidBankClient sessionId={sessionId} />
    </>
  );
}
