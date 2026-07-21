import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionId } from "@/lib/session-id";
import { WheelClient } from "./wheel-client";

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function WheelPage({ searchParams }: Props) {
  const sessionId = await resolveServerSessionId(await searchParams);

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <WheelClient sessionId={sessionId} />
    </>
  );
}
