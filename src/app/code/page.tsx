import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { CodeEntryClient } from "./code-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function CodeEntryPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <CodeEntryClient sessionId={sessionId} />
    </>
  );
}