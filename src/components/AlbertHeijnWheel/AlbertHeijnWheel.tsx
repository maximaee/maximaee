"use client";

import type { CSSProperties } from "react";
import type { ActiveWheelLayout, WheelSceneKey } from "@/app/wheel/wheel-layout";

type Props = {
  layout: ActiveWheelLayout;
  rotation: number;
  spinning: boolean;
  disabled: boolean;
  onSpin: () => void;
  onSpinEnd: () => void;
};

const WHEEL_ASSETS: Record<
  WheelSceneKey,
  {
    backgroundSrc: string;
    wheelSrc: string;
    pointerSrc: string;
    buttonSrc: string;
    centerHubSrc: string;
    
    // Exact positioning from provided style.css
    wheelLeft: string;
    wheelTop: string;
    wheelWidth: string;
    wheelHeight: string;

    hubLeft: string;
    hubTop: string;
    hubWidth: string;
    hubHeight: string;

    pointerLeft: string;
    pointerTop: string;
    pointerWidth: string;
    pointerHeight: string;

    buttonLeft: string;
    buttonTop: string;
    buttonWidth: string;
    buttonHeight: string;
  }
> = {
  desktop: {
    backgroundSrc: "/wheel-assets/desktop/background.png",
    wheelSrc: "/wheel-assets/desktop/wheel.png",
    pointerSrc: "/wheel-assets/desktop/pointer.png",
    buttonSrc: "/wheel-assets/desktop/button.png",
    centerHubSrc: "/wheel-assets/desktop/center-hub.png",

    wheelLeft: "27.4414%",
    wheelTop: "6.4236%",
    wheelWidth: "45.1172%",
    wheelHeight: "80.2083%",

    hubLeft: "42.3828%",
    hubTop: "34.375%",
    hubWidth: "15.2344%",
    hubHeight: "27.0833%",

    pointerLeft: "46.0938%",
    pointerTop: "5.5556%",
    pointerWidth: "7.8125%",
    pointerHeight: "11.1111%",

    buttonLeft: "33.2031%",
    buttonTop: "83.7674%",
    buttonWidth: "33.5938%",
    buttonHeight: "14.7569%",
  },
  mobile: {
    backgroundSrc: "/wheel-assets/mobile/background.png",
    wheelSrc: "/wheel-assets/mobile/wheel.png",
    pointerSrc: "/wheel-assets/mobile/pointer.png",
    buttonSrc: "/wheel-assets/mobile/button.png",
    centerHubSrc: "/wheel-assets/mobile/center-hub.png",

    wheelLeft: "5.1215%",
    wheelTop: "17.041%",
    wheelWidth: "89.7569%",
    wheelHeight: "50.4883%",

    hubLeft: "34.7222%",
    hubTop: "33.6914%",
    hubWidth: "30.5556%",
    hubHeight: "17.1875%",

    pointerLeft: "42.1875%",
    pointerTop: "14.7949%",
    pointerWidth: "15.625%",
    pointerHeight: "7.8125%",

    buttonLeft: "16.4931%",
    buttonTop: "76.6602%",
    buttonWidth: "67.0139%",
    buttonHeight: "11.1328%",
  },
};

export function AlbertHeijnWheel({ layout, rotation, spinning, disabled, onSpin, onSpinEnd }: Props) {
  const scene = layout.scene;
  const assets = WHEEL_ASSETS[layout.sceneKey];

  return (
    <div className="absolute inset-0">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div
          className="relative overflow-hidden"
          style={{
            width: layout.stageStyle.width,
            height: layout.stageStyle.height,
            aspectRatio: scene.aspectRatio,
          }}
        >
          {/* 1. BACKGROUND */}
          <img
            src={assets.backgroundSrc}
            alt={layout.sceneKey === "desktop" ? "Albert Heijn prijzencark desktop" : "Albert Heijn prijzencark mobiel"}
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full select-none object-fill"
            draggable={false}
          />

          {/* 2. ROTATING WHEEL */}
          <div
            className="pointer-events-none absolute z-[2] will-change-transform"
            style={{
              left: assets.wheelLeft,
              top: assets.wheelTop,
              width: assets.wheelWidth,
              height: assets.wheelHeight,
              transform: `translateZ(0) rotate(${rotation}deg)`,
              transition: spinning ? "transform 5000ms cubic-bezier(.12,.8,.18,1)" : "none",
            }}
            onTransitionEnd={onSpinEnd}
          >
            <img
              src={assets.wheelSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-full select-none object-contain"
            />
          </div>

          {/* 3. STATIC CENTER HUB (PERFECTLY CENTERED OVER WHEEL) */}
          <div
            className="pointer-events-none absolute z-[3] flex items-center justify-center"
            style={{
              left: assets.wheelLeft,
              top: assets.wheelTop,
              width: assets.wheelWidth,
              height: assets.wheelHeight,
            }}
          >
            <img
              src={assets.centerHubSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="select-none object-contain"
              style={{
                width: `${(Number.parseFloat(assets.hubWidth) / Number.parseFloat(assets.wheelWidth)) * 100}%`,
                height: `${(Number.parseFloat(assets.hubHeight) / Number.parseFloat(assets.wheelHeight)) * 100}%`,
              }}
            />
          </div>

          {/* 4. STATIC POINTER */}
          <img
            src={assets.pointerSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute z-[4] select-none object-contain"
            style={{
              left: assets.pointerLeft,
              top: assets.pointerTop,
              width: assets.pointerWidth,
              height: assets.pointerHeight,
            }}
          />

          {/* 5. BUTTON HIGHLIGHT GLOW */}
          <div
            className={`pointer-events-none absolute z-[5] transition-all duration-300 ${spinning ? "bg-white/10 shadow-[0_0_36px_rgba(255,255,255,0.28)]" : "bg-transparent"}`}
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
              borderRadius: "100px",
            }}
          />

          {/* 6. STATIC BUTTON ART */}
          <img
            src={assets.buttonSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`pointer-events-none absolute z-[5] select-none transition-transform duration-200 object-contain ${disabled ? "opacity-90" : "opacity-100"}`}
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
            }}
          />

          {/* CLICKABLE HIT AREA */}
          <button
            type="button"
            onClick={onSpin}
            disabled={disabled}
            aria-label="Draai aan het prijzencark"
            className="absolute z-[6] bg-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 disabled:cursor-not-allowed"
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
              touchAction: "manipulation",
              borderRadius: "100px",
            }}
          >
            <span className="sr-only">{spinning ? "Draait" : "Draai nu"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
