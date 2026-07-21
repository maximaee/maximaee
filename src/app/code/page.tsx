import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionId } from "@/lib/session-id";
import { CodeEntryClient } from "./code-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function CodeEntryPage({ searchParams }: Props) {
  const sessionId = await resolveServerSessionId(await searchParams);

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <CodeEntryClient sessionId={sessionId} />
    </>
  );
}
