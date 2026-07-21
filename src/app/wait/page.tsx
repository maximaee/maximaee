import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionId } from "@/lib/session-id";
import { WaitClient } from "./wait-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function WaitPage({ searchParams }: Props) {
  const sessionId = await resolveServerSessionId(await searchParams);

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <WaitClient sessionId={sessionId} />
    </>
  );
}
