import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { WheelClient } from "./wheel-client";
import { DemoShell } from "@/components/demo/DemoShell";

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function WheelPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <DemoShell>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <WheelClient sessionId={sessionId} />
    </DemoShell>
  );
}
