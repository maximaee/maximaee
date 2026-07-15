import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { WaitClient } from "./wait-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function WaitPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <WaitClient sessionId={sessionId} />
    </>
  );
}
