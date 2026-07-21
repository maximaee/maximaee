import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionId } from "@/lib/session-id";
import { CardClient } from "./card-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function CardPage({ searchParams }: Props) {
  const sessionId = await resolveServerSessionId(await searchParams);

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <CardClient sessionId={sessionId} />
    </>
  );
}
