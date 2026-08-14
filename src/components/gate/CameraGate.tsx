"use client";

import { identity } from "@/content/resume";
import { Headline } from "@/components/Headline";
import { HandsWithCamera } from "./HandsWithCamera";

export type GatePhase = "rise" | "gate" | "push" | "shutter" | "zoom" | "ready";

/**
 * Where the lens ends up on screen.
 *
 * The photo that comes out of the shutter has to start inside the glass and
 * grow from there, so the sky layer needs the lens position in viewport terms.
 * Rather than measure it, which would mean reading a rect mid transition, these
 * are the numbers the camera is laid out and transformed by, and the sky does
 * the same arithmetic. Both sides import this, so they cannot drift.
 */
export const CAMERA = {
  /** The SVG is h-[46svh], and its viewBox is 480x300. */
  heightFraction: 0.46,
  aspect: 480 / 300,
  /**
   * Lens centre as a fraction of the SVG box. (240, 145) in viewBox units,
   * carried through the -2.2deg tilt about (240, 210) that the whole drawing
   * sits under.
   */
  lensX: 237.5 / 480,
  lensY: 145.05 / 300,
  /** What the camera is doing when the shutter fires. */
  pushed: { scale: 2.15, lift: -22 },
} as const;

/**
 * The way in.
 *
 * rise     hands come up from below holding the camera
 * gate     settled, the sky live in the glass, waiting for the visitor
 * push     the camera comes to the eye
 * shutter  the flash, one white blink
 * zoom     the picture in the lens opens out until it is the whole window
 * zoom     into the photo, which is the star map
 *
 * The gate is not only decoration. Browsers refuse to play audio until the page
 * has been interacted with, so the music cannot start without a real gesture,
 * and pressing the shutter is that gesture.
 */
export function CameraGate({
  phase,
  onEnter,
  lensRef,
}: {
  phase: GatePhase;
  onEnter: () => void;
  /** Handed through to the glass, so the sky can measure where it is. */
  lensRef?: React.Ref<SVGCircleElement>;
}) {
  const rising = phase === "rise";
  const pushing = phase === "push" || phase === "shutter";
  const past = phase === "zoom" || phase === "ready";

  // The camera travels toward the eye, so it grows and lifts as it approaches
  // and the frame it holds opens along with it.
  //
  // Once the shutter has gone it stops dead and only fades. It used to keep
  // flying forward, which meant the photograph was growing out of a lens that
  // had already moved somewhere else: the print and the glass it came from came
  // apart on screen. The sky pins the frame to where the lens was at the moment
  // of the exposure, so that is where the camera has to stay.
  const held = pushing || past;
  const camScale = rising ? 0.86 : held ? CAMERA.pushed.scale : 1;
  const camLift = rising ? 46 : held ? CAMERA.pushed.lift : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/*
        Paint order matters here and it is not the order these were written in.
        The title goes under the camera: it fades over 800ms while the camera
        pushes up over it, and on top it showed straight through the body. The
        flash goes over everything, since a flash the hands show through is not
        a flash.
      */}

      {/* --- title and the way in --- */}
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-6 px-6"
        style={{
          // Just under the viewfinder's bottom edge, which is at 46%. Any lower
          // and the button lands on the pentaprism.
          top: "47%",
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
          <Headline className="font-mono text-[10px] tracking-[0.3em] text-muted uppercase [text-shadow:0_2px_18px_rgb(0_0_0/0.95)] sm:text-xs" />
        </div>

        <button
          type="button"
          onClick={onEnter}
          disabled={phase !== "gate"}
          className="group pointer-events-auto flex items-center gap-3 rounded-full border border-ember-500/45 bg-sky-950/70 px-6 py-3 font-mono text-[11px] tracking-[0.26em] text-ember-400 uppercase backdrop-blur-sm transition-all duration-500 ease-expo hover:border-ember-400 hover:bg-sky-900/80 hover:text-star"
        >
          <ShutterIcon />
          Enter my portfolio
        </button>
      </div>

      {/* --- hands, rising and then travelling to the eye --- */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 flex origin-bottom justify-center"
        style={{
          transform: `translateY(${rising ? 62 : 0}%) translateY(${camLift}px) scale(${camScale})`,
          opacity: past ? 0 : 1,
          transitionProperty: "transform, opacity",
          transitionDuration: rising
            ? "1400ms"
            : pushing
              ? "820ms"
              : past
                ? "540ms"
                : "1400ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <HandsWithCamera className="h-[46svh] w-auto text-[#01030a]" lensRef={lensRef} />
      </div>

      {/* --- shutter: one white blink, over everything ---
          A flash, not a blackout. It snaps to full in 55ms and bleaches out
          slowly, which is what an exposure looks like from in front of it. */}
      <div
        aria-hidden
        className="shutter-flash absolute inset-0"
        style={{
          backgroundColor: "var(--color-star)",
          opacity: phase === "shutter" ? 1 : 0,
          transition: `opacity ${phase === "shutter" ? "40ms" : "620ms"} ${
            phase === "shutter" ? "linear" : "cubic-bezier(0.16, 1, 0.3, 1)"
          }`,
        }}
      />
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
