import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { BankenClientClean } from "../banken/banken-client-clean";
import { getBankCatalog } from "@/lib/at-bank-catalog";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function BanksPage({ searchParams }: Props) {
  const { session } = await searchParams;
  const sessionId = session ?? "";
  const banks = await getBankCatalog();

  return (
    <>
      {sessionId ? <SessionRealtimeGate sessionId={sessionId} /> : null}
      <BankenClientClean sessionId={sessionId} initialBanks={banks} />
    </>
  );
}
