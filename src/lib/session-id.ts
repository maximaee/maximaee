import { cookies } from "next/headers";
import { ACTIVE_SESSION_COOKIE } from "@/lib/session-constants";

export async function resolveServerSessionId(searchParams?: { session?: string | null }) {
  const fromQuery = searchParams?.session?.trim();
  if (fromQuery) {
    return fromQuery;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_SESSION_COOKIE)?.value ?? "";
}
