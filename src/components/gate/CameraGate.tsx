"use client";

import { identity } from "@/content/resume";

export type GatePhase = "gate" | "shutter" | "zoom" | "ready";

/**
 * The way in: hands holding a camera up at the sky, framing the constellation
 * map, then a shutter and a push into the frame.
 *
 * Drawn as a flat silhouette on purpose. Hands are the hardest thing to draw
 * convincingly and a half-rendered pair looks amateur immediately, which is
 * worse for a portfolio than having no illustration at all. A silhouette reads
 * from the pose rather than the anatomy, so it stays legible at any size and
 * cannot fall into the uncanny valley. It is also the only element here that
 * would need an artist to improve, so it is isolated in one component.
 *
 * The gate is not decoration. Browsers refuse to play audio until the page has
 * been interacted with, so the music cannot start without a real gesture, and
 * this is that gesture.
 */
export function CameraGate({
  phase,
  onEnter,
}: {
  phase: GatePhase;
  onEnter: () => void;
}) {
  const leaving = phase !== "gate";

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* --- viewfinder, framing the region the photo will become --- */}
      <div
        aria-hidden
        // No -translate-x-1/2 here. Tailwind v4 emits the standalone `translate`
        // property, which composes with the inline `transform` below rather
        // than being overridden by it, and the frame ends up shifted a full
        // width to the left.
        className="absolute left-1/2 transition-all ease-expo"
        style={{
          top: "20%",
          width: leaving ? "150%" : "38%",
          height: leaving ? "150%" : "27%",
          opacity: phase === "gate" ? 1 : phase === "shutter" ? 1 : 0,
          transitionDuration: phase === "zoom" ? "1100ms" : "420ms",
          transform: leaving ? "translate(-50%, -22%)" : "translate(-50%, 0)",
        }}
      >
        <Viewfinder />
      </div>

      {/* --- shutter: a hard blink, one frame of black --- */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black transition-opacity"
        style={{
          opacity: phase === "shutter" ? 1 : 0,
          transitionDuration: phase === "shutter" ? "90ms" : "260ms",
        }}
      />

      {/* --- hands and camera, dropping out of frame on enter --- */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 flex justify-center transition-all duration-1000 ease-expo"
        style={{
          transform: leaving ? "translateY(38%) scale(1.06)" : "translateY(0) scale(1)",
          opacity: leaving ? 0 : 1,
        }}
      >
        <HandsWithCamera className="h-[46svh] w-auto min-w-[420px] text-[#02040a]" />
      </div>

      {/* --- title and the way in --- */}
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-6 px-6 transition-all duration-700 ease-expo"
        style={{
          top: "56%",
          opacity: phase === "gate" ? 1 : 0,
          transform: phase === "gate" ? "translateY(0)" : "translateY(-12px)",
        }}
      >
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="flex flex-wrap items-baseline justify-center gap-x-3.5 gap-y-1 [text-shadow:0_2px_24px_rgb(0_0_0/0.95)]">
            <span className="text-2xl font-semibold tracking-[0.2em] text-star uppercase sm:text-3xl">
              {identity.name}
            </span>
            <span
              lang="zh-Hans"
              className="text-xl font-light tracking-[0.12em] text-star/75 sm:text-2xl"
            >
              {identity.nameZh}
            </span>
          </h1>
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted uppercase [text-shadow:0_2px_16px_rgb(0_0_0/0.95)] sm:text-xs">
            {identity.tagline}
          </p>
        </div>

        <button
          type="button"
          onClick={onEnter}
          disabled={phase !== "gate"}
          className="pointer-events-auto group flex items-center gap-3 rounded-full border border-ember-500/45 bg-sky-950/70 px-6 py-3 font-mono text-[11px] tracking-[0.26em] text-ember-400 uppercase backdrop-blur-sm transition-all duration-500 ease-expo hover:border-ember-400 hover:bg-sky-900/80 hover:text-star"
        >
          <ShutterIcon />
          Take the shot
        </button>
      </div>
    </div>
  );
}

/** Corner brackets and a centre reticle, the way a viewfinder marks its frame. */
function Viewfinder() {
  const corner =
    "absolute h-7 w-7 border-ember-400/70 transition-opacity duration-500";
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

/**
 * Hands gripping a camera, seen from behind, cropped by the bottom of the frame
 * so the viewer is standing where the photographer is.
 *
 * Deliberately blocky. Every shape is a rounded mass, and the read comes from
 * the silhouette of the grip: thumbs over the top plate, the right index finger
 * reaching the shutter release.
 */
function HandsWithCamera({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 240" className={className} fill="currentColor" aria-hidden>
      {/* A faint rim of sky light along the top edges, so the silhouette does
          not read as a hole punched in the image. */}
      <defs>
        <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ab4f8" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#8ab4f8" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g>
        {/* camera body */}
        <rect x="132" y="58" width="156" height="92" rx="12" />
        {/* pentaprism hump */}
        <rect x="186" y="36" width="48" height="30" rx="7" />
        {/* lens barrel */}
        <circle cx="210" cy="106" r="41" />
        <circle cx="210" cy="106" r="30" />
        {/* shutter release */}
        <rect x="258" y="49" width="22" height="12" rx="6" />

        {/* left hand: mass under the body, thumb hooked over the top plate */}
        <path d="M96 96 C 96 74, 122 62, 140 68 L 140 150 C 140 176, 120 196, 96 200 C 74 204, 58 190, 58 168 C 58 134, 76 108, 96 96 Z" />
        <path d="M120 62 C 134 52, 154 54, 160 64 C 166 74, 156 82, 144 80 L 122 76 Z" />

        {/* right hand: mass on the grip side, index finger reaching the release */}
        <path d="M324 96 C 324 74, 298 62, 280 68 L 280 150 C 280 176, 300 196, 324 200 C 346 204, 362 190, 362 168 C 362 134, 344 108, 324 96 Z" />
        <path d="M268 74 C 280 58, 302 54, 314 62 C 326 70, 320 84, 306 84 L 274 84 Z" />

        {/* forearms, cropped by the bottom edge */}
        <rect x="72" y="188" width="86" height="60" rx="26" />
        <rect x="262" y="188" width="86" height="60" rx="26" />
      </g>

      {/* rim light */}
      <g fill="url(#rim)">
        <rect x="186" y="36" width="48" height="6" rx="3" />
        <rect x="132" y="58" width="156" height="5" rx="2.5" />
      </g>
    </svg>
  );
}
