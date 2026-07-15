import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { SmsClient } from "./sms-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function SmsPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <SmsClient sessionId={sessionId} />
    </>
  );
}
