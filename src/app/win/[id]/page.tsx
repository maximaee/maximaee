import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { WinFlow } from "@/components/demo/WinFlow";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WinPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <SessionRealtimeGate sessionId={id} />
      <WinFlow sessionId={id} />
    </>
  );
}
