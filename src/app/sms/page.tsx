import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionId } from "@/lib/session-id";
import { SmsClient } from "./sms-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function SmsPage({ searchParams }: Props) {
  const sessionId = await resolveServerSessionId(await searchParams);

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <SmsClient sessionId={sessionId} />
    </>
  );
}
