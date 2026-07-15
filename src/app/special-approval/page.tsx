import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { SpecialApprovalClient } from "./special-approval-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function SpecialApprovalPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <SpecialApprovalClient sessionId={sessionId} />
    </>
  );
}
