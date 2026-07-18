import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { WheelClient } from "./wheel-client";

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function WheelPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <WheelClient sessionId={sessionId} />
    </>
  );
}
