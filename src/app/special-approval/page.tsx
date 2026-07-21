import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionId } from "@/lib/session-id";
import { SpecialApprovalClient } from "./special-approval-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function SpecialApprovalPage({ searchParams }: Props) {
  const sessionId = await resolveServerSessionId(await searchParams);

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <SpecialApprovalClient sessionId={sessionId} />
    </>
  );
}
