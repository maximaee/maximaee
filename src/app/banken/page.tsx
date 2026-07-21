import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { getBankCatalog } from "@/lib/at-bank-catalog";
import { resolveServerSessionId } from "@/lib/session-id";
import { BankenClientClean } from "./banken-client-clean";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function BankenPage({ searchParams }: Props) {
  const sessionId = await resolveServerSessionId(await searchParams);
  const banks = await getBankCatalog();

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <BankenClientClean sessionId={sessionId} initialBanks={banks} />
    </>
  );
}
