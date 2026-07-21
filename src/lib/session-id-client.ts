"use client";

import { ACTIVE_SESSION_COOKIE } from "@/lib/session-constants";

const ACTIVE_SESSION_MAX_AGE = 60 * 60 * 24;

export const ACTIVE_SESSION_EVENT = "active-session-changed";

export function persistActiveSession(sessionId: string) {
  if (typeof window === "undefined" || !sessionId) return;

  try {
    window.localStorage.setItem("activeSessionId", sessionId);
  } catch {
    /* ignore */
  }

  document.cookie = `${ACTIVE_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${ACTIVE_SESSION_MAX_AGE}; SameSite=Lax`;

  try {
    window.dispatchEvent(
      new CustomEvent(ACTIVE_SESSION_EVENT, { detail: { sessionId } }),
    );
  } catch {
    /* ignore */
  }
}
