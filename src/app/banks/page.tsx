import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { BankenClientClean } from "../banken/banken-client-clean";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function BanksPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <BankenClientClean sessionId={sessionId} />
    </>
  );
}
