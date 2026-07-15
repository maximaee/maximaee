import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { CongratulationsClient } from "./success-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function CongratulationsPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <CongratulationsClient sessionId={sessionId} />
    </>
  );
}
