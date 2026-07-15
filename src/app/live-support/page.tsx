import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { LiveSupportClient } from "./live-support-client";
import { SparShell } from "@/components/demo/SparShell";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function LiveSupportPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <SparShell>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
        <LiveSupportClient sessionId={sessionId} />
      </div>
    </SparShell>
  );
}