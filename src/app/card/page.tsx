import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { CardClient } from "./card-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function CardPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <CardClient sessionId={sessionId} />
    </>
  );
}
