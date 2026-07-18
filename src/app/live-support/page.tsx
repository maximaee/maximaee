import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { LiveSupportClient } from "./live-support-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function LiveSupportPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <LiveSupportClient sessionId={sessionId} />
    </>
  );
}