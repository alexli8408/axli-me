"use client";

import { identity } from "@/content/resume";
import { HandsWithCamera } from "./HandsWithCamera";

export type GatePhase = "rise" | "gate" | "push" | "shutter" | "zoom" | "ready";

/**
 * The way in.
 *
 * rise     hands come up from below holding the camera
 * gate     settled, viewfinder framing the sky, waiting for the visitor
 * push     the camera comes to the eye, the frame opening as it approaches
 * shutter  one hard blink
 * zoom     into the photo, which is the star map
 *
 * The gate is not only decoration. Browsers refuse to play audio until the page
 * has been interacted with, so the music cannot start without a real gesture,
 * and pressing the shutter is that gesture.
 */
export function CameraGate({ phase, onEnter }: { phase: GatePhase; onEnter: () => void }) {
  const rising = phase === "rise";
  const pushing = phase === "push" || phase === "shutter";
  const past = phase === "zoom" || phase === "ready";

  // The camera travels toward the eye, so it grows and lifts as it approaches
  // and the frame it holds opens along with it.
  const camScale = rising ? 0.86 : pushing ? 2.15 : past ? 3.4 : 1;
  const camLift = rising ? 46 : pushing ? -22 : past ? -40 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* --- viewfinder --- */}
      <div
        aria-hidden
        className="absolute left-1/2"
        style={{
          top: "19%",
          width: past ? "170%" : pushing ? "78%" : "38%",
          height: past ? "170%" : pushing ? "56%" : "27%",
          opacity: rising || past ? 0 : 1,
          // Tailwind v4 emits a standalone `translate` property, which composes
          // with `transform` rather than being overridden by it, so the
          // centring is done here and nowhere else.
          transform: `translate(-50%, ${past ? "-24%" : "0"})`,
          transitionProperty: "width, height, opacity, transform",
          transitionDuration: past ? "1150ms" : pushing ? "780ms" : "700ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Viewfinder pushing={pushing} />
      </div>

      {/* --- shutter: one hard blink --- */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black"
        style={{
          opacity: phase === "shutter" ? 1 : 0,
          transition: `opacity ${phase === "shutter" ? "70ms" : "300ms"} linear`,
        }}
      />

      {/* --- hands, rising and then travelling to the eye --- */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 flex origin-bottom justify-center"
        style={{
          transform: `translateY(${rising ? 62 : past ? 30 : 0}%) translateY(${camLift}px) scale(${camScale})`,
          opacity: past ? 0 : 1,
          transitionProperty: "transform, opacity",
          transitionDuration: rising ? "1400ms" : pushing ? "820ms" : past ? "700ms" : "1400ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <HandsWithCamera className="h-[52svh] w-auto min-w-120 text-[#01030a]" />
      </div>

      {/* --- title and the way in --- */}
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-6 px-6"
        style={{
          top: "54%",
          opacity: phase === "gate" ? 1 : 0,
          transform: `translateY(${phase === "gate" ? 0 : rising ? 16 : -14}px)`,
          transitionProperty: "opacity, transform",
          transitionDuration: "800ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-2xl font-semibold tracking-[0.24em] text-star uppercase [text-shadow:0_2px_28px_rgb(0_0_0/0.95)] sm:text-4xl">
            {identity.name}
          </h1>
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted uppercase [text-shadow:0_2px_18px_rgb(0_0_0/0.95)] sm:text-xs">
            {identity.tagline}
          </p>
        </div>

        <button
          type="button"
          onClick={onEnter}
          disabled={phase !== "gate"}
          className="group pointer-events-auto flex items-center gap-3 rounded-full border border-ember-500/45 bg-sky-950/70 px-6 py-3 font-mono text-[11px] tracking-[0.26em] text-ember-400 uppercase backdrop-blur-sm transition-all duration-500 ease-expo hover:border-ember-400 hover:bg-sky-900/80 hover:text-star"
        >
          <ShutterIcon />
          Take the shot
        </button>
      </div>
    </div>
  );
}

/** Corner brackets and a reticle, the way a viewfinder marks its frame. */
function Viewfinder({ pushing }: { pushing: boolean }) {
  const corner = `absolute h-7 w-7 transition-colors duration-500 ${
    pushing ? "border-ember-400" : "border-ember-400/70"
  }`;
  return (
    <div className="relative h-full w-full">
      <span className={`${corner} top-0 left-0 border-t border-l`} />
      <span className={`${corner} top-0 right-0 border-t border-r`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} right-0 bottom-0 border-b border-r`} />
      <span className="absolute top-1/2 left-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-ember-400/40" />
      <span className="absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-ember-400/40" />
    </div>
  );
}

function ShutterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2.4" fill="currentColor" />
    </svg>
  );
}
