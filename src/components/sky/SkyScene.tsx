"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CAMERA, CameraGate, type GatePhase } from "@/components/gate/CameraGate";
import { useSectionOverlays } from "@/components/overlay/SectionOverlays";
import { Constellations } from "./Constellations";
import { StarField, type SkyView } from "./StarField";

/** The camera rises on load, then the visitor drives the rest. */
const RISE_MS = 1500;
const PUSH_MS = 820;
const SHUTTER_MS = 230;
/**
 * How long to wait, once the shutter fires, before shrinking the sky.
 *
 * The flash needs to be all the way up first. React has to render, the browser
 * has to apply the style and start the transition, and only then does the white
 * climb: measured, it is opaque around 60ms in. Snapping the moment the phase
 * changed put the collapse on screen at about a third of a flash, so you saw
 * the sky drop into a small rectangle instead of a photograph being taken.
 */
const SNAP_MS = 100;
const ZOOM_MS = 1250;

/**
 * How small the photo is when it lands, as a fraction of the finished sky.
 *
 * At 0.075 the frame is about the width of the glass it came out of, which is
 * the whole point: the thing that grows on screen has to be the same thing that
 * was sitting in the lens a moment earlier.
 */
const PHOTO_SCALE = 0.075;

/** The sky sits slightly pushed in behind the viewfinder, then settles back. */
const GATE_SCALE = 1.16;

/**
 * Where the lens is, in fractions of the viewport, at the moment the shutter
 * fires.
 *
 * This repeats the arithmetic the camera's own layout and transform do rather
 * than measuring a rect, since the measurement would have to happen mid
 * transition. The constants come from CAMERA, so the two cannot drift apart.
 */
function lensCentre(): { ox: number; oy: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const h = CAMERA.heightFraction * vh;
  const w = h * CAMERA.aspect;

  // Where the lens sits before the camera is transformed.
  const x = (vw - w) / 2 + CAMERA.lensX * w;
  const y = vh - h + CAMERA.lensY * h;

  // The camera scales about the bottom centre of the viewport, then lifts.
  const { scale, lift } = CAMERA.pushed;
  return {
    ox: (vw / 2 + scale * (x - vw / 2)) / vw,
    oy: (vh + scale * (y - vh) + lift) / vh,
  };
}

export function SkyScene() {
  const [phase, setPhase] = useState<GatePhase>("rise");
  const [motion, setMotion] = useState(true);
  const { open, notifyReady } = useSectionOverlays();
  const timers = useRef<number[]>([]);

  const skyRef = useRef<HTMLDivElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const frame = useRef(0);
  /** Shared with the canvas, which reads it fresh every frame. */
  const view = useRef<SkyView>({ s: GATE_SCALE, ox: 0.5, oy: 0.5 });

  /**
   * Clip the sky down to the photo.
   *
   * Each inset is that edge's distance from the lens times (1 - s), which is
   * exactly the rectangle you get by scaling the viewport about the lens. The
   * canvas scales its contents about the same point by the same amount, so the
   * frame and the stars inside it are one movement rather than two that have to
   * be kept in step. That was the thing that was wrong before: the sky zoomed on
   * its own schedule and never felt like it was inside the picture. At s of 1 or
   * more there is nothing to clip.
   */
  const clip = useCallback(() => {
    const el = skyRef.current;
    if (!el) return;

    const { s, ox, oy } = view.current;
    const k = 1 - s;
    if (k <= 0.001) {
      el.style.clipPath = "none";
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const px = (n: number) => `${n.toFixed(1)}px`;
    el.style.clipPath =
      `inset(${px(oy * vh * k)} ${px((1 - ox) * vw * k)} ` +
      `${px((1 - oy) * vh * k)} ${px(ox * vw * k)} ` +
      `round ${px(Math.min(1, k * 4) * 9)})`;
  }, []);

  // Timers are scheduled in one go rather than from an effect keyed on phase.
  // Doing it in an effect meant the cleanup fired the moment phase advanced and
  // cancelled the timer for the step after it, so the sequence stalled short.
  useEffect(() => {
    const t = window.setTimeout(() => setPhase("gate"), RISE_MS);
    timers.current.push(t);
    return () => clearTimeout(t);
  }, []);

  const enter = useCallback(() => {
    setPhase((p) => {
      if (p !== "gate") return p;
      timers.current.push(
        window.setTimeout(() => setPhase("shutter"), PUSH_MS),
        window.setTimeout(() => setPhase("zoom"), PUSH_MS + SHUTTER_MS),
        window.setTimeout(() => setPhase("ready"), PUSH_MS + SHUTTER_MS + ZOOM_MS),
      );
      return "push";
    });
  }, []);

  /**
   * The photo.
   *
   * On the shutter the sky snaps from full screen down to a frame the size of
   * the glass. That jump is instant and it happens underneath the flash, which
   * is at full white for those few frames, so what the visitor sees is a
   * picture being taken. Then the frame grows back out to the whole window,
   * carrying its stars with it.
   */
  useEffect(() => {
    if (phase === "shutter") {
      const t = window.setTimeout(() => {
        view.current = { s: PHOTO_SCALE, ...lensCentre() };
        clip();
        wakeRef.current?.();
      }, SNAP_MS);
      return () => clearTimeout(t);
    }

    if (phase === "ready") {
      view.current.s = 1;
      clip();
      wakeRef.current?.();
      return;
    }

    if (phase !== "zoom") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      view.current.s = 1;
      clip();
      wakeRef.current?.();
      return;
    }

    const from = view.current.s;
    const start = performance.now();
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / ZOOM_MS);
      // Interpolated in log space, not linearly. Scale is multiplicative, so
      // stepping it evenly makes a zoom that crawls at the start and tears
      // through the end, and going up by a constant ratio instead is what reads
      // as a steady push in.
      //
      // Eased out only, never in. An ease on both sides held the frame at lens
      // size for most of a second after the flash had already cleared, so there
      // was a beat of staring at a stamp before anything happened.
      const eased = 1 - Math.pow(1 - u, 1.6);
      view.current.s = u === 1 ? 1 : Math.pow(from, 1 - eased);
      clip();
      wakeRef.current?.();
      if (u < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [phase, clip]);

  useEffect(() => {
    if (phase === "ready") notifyReady();
  }, [phase, notifyReady]);

  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  const entering = phase === "zoom" || phase === "ready";

  return (
    <main
      className="relative h-svh w-full overflow-hidden bg-sky-950"
      data-motion={motion ? "on" : "off"}
    >
      {/*
        The sky, which is also the photograph. It rises above the camera once
        the shutter has gone, because until then the print would be growing out
        of the back of the body that took it.
      */}
      <div
        ref={skyRef}
        className="absolute inset-0"
        style={{ zIndex: entering ? 30 : 0 }}
      >
        <StarField dim={!entering} paused={!motion} view={view} wakeRef={wakeRef} />
      </div>

      <Constellations onOpen={open} revealed={phase === "ready"} />

      <CameraGate phase={phase} onEnter={enter} />

      {/*
        WCAG 2.2.2. The field twinkles and throws meteors for as long as the tab
        is open, which is moving content past five seconds, and that needs a way
        to stop it. It appears with the map rather than over the gate, since
        there is nothing to read until then.
      */}
      <button
        type="button"
        onClick={() => setMotion((m) => !m)}
        aria-pressed={!motion}
        className="absolute right-4 bottom-4 z-50 rounded-full border border-line p-2.5 text-faint transition-all duration-500 ease-expo hover:border-line-strong hover:text-star focus-visible:opacity-100"
        style={{
          opacity: phase === "ready" ? 1 : 0,
          pointerEvents: phase === "ready" ? "auto" : "none",
        }}
      >
        <span className="sr-only">{motion ? "Pause the sky" : "Let the sky move"}</span>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
          {motion ? (
            <>
              <rect x="3" y="2.5" width="2.6" height="9" rx="1" fill="currentColor" />
              <rect x="8.4" y="2.5" width="2.6" height="9" rx="1" fill="currentColor" />
            </>
          ) : (
            <path d="M4 2.6l7 4.4-7 4.4z" fill="currentColor" />
          )}
        </svg>
      </button>
    </main>
  );
}
