"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Radio } from "@/components/audio/Radio";
import { CameraGate, type GatePhase } from "@/components/gate/CameraGate";
import { Headline } from "@/components/Headline";
import { identity } from "@/content/resume";
import { useSectionOverlays } from "@/components/overlay/SectionOverlays";
import { Constellations } from "./Constellations";
import { StarField, type SkyView } from "./StarField";

/** The camera rises on load, then the visitor drives the rest. */
const RISE_MS = 1500;
const PUSH_MS = 820;
const SHUTTER_MS = 190;
const ZOOM_MS = 1500;

/** The sky behind the camera sits slightly pushed in, then settles back. */
const GATE_SCALE = 1.16;

/**
 * Smallest the sky inside the frame is ever drawn.
 *
 * Left to itself the picture would be scaled just far enough to fill whatever
 * aperture it has, and inside a lens the size of a coin that means the whole
 * field compressed about ten times over: stars land on each other and it reads
 * as noise. Holding it here crops instead, so what sits in the glass is the
 * middle of the sky rather than all of it at once.
 */
const MIN_PHOTO_SCALE = 0.34;

/**
 * How long into the shutter the window becomes the photograph.
 *
 * The handover swaps the background from the real sky to the sky at the
 * frame's scale, which is a large change and has to happen where nobody can
 * see it. The flash is opaque about 60ms in, so this sits behind it with room
 * either side.
 */
const HANDOVER_MS = 110;

/** How far inside the rim the picture sits, so the glass keeps an edge. */
const APERTURE_INSET = 0.9;

export function SkyScene() {
  const [phase, setPhase] = useState<GatePhase>("rise");
  const [motion, setMotion] = useState(true);
  const { open, notifyReady } = useSectionOverlays();
  const timers = useRef<number[]>([]);

  const lensRef = useRef<SVGCircleElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const phaseRef = useRef<GatePhase>(phase);
  const zoomFrom = useRef<{ cx: number; cy: number; r: number } | null>(null);
  /** Shared with the canvas, which reads it fresh every frame. */
  const view = useRef<SkyView>({ ambient: GATE_SCALE, dim: true, photo: null, unified: false });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /**
   * Where the picture is and how big, for one frame.
   *
   * u runs 0 to 1 across the zoom and is 0 for every phase before it. The
   * aperture is a rounded rectangle the whole way, which is what lets a circle
   * become a frame without ever swapping shapes: a square with a corner radius
   * of half its side is a circle, so easing width, height and radius together
   * opens one into the other.
   */
  const place = useCallback((u: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const start = zoomFrom.current ?? readLens(lensRef.current);
    if (!start) {
      view.current.photo = null;
      return;
    }

    // Smooth at both ends. It has to leave the glass without a jerk and reach
    // the edges of the window without slamming into them.
    const e = u * u * (3 - 2 * u);
    const lerp = (a: number, b: number) => a + (b - a) * e;

    const d = start.r * 2;
    const w = lerp(d, vw);
    const h = lerp(d, vh);
    const cx = lerp(start.cx, vw / 2);
    const cy = lerp(start.cy, vh / 2);

    view.current.photo = {
      scale: Math.max(MIN_PHOTO_SCALE, w / vw, h / vh),
      x: cx - w / 2,
      y: cy - h / 2,
      w,
      h,
      // Squares off ahead of the rest, so it reads as a frame well before it
      // reaches the corners instead of staying rounded to the last moment.
      r: start.r * Math.max(0, 1 - Math.min(1, e * 1.45)),
      full: u >= 1,
    };
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
   * One loop for the whole sequence.
   *
   * Before the shutter it follows the lens, which is moving under a CSS
   * transition this has no way to read, so it measures rather than predicts.
   * From the shutter on, the lens is frozen where the exposure happened and the
   * loop drives the opening instead.
   */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let zoomStart = 0;
    let shutterAt = 0;

    const step = (now: number) => {
      const p = phaseRef.current;

      // The sky behind stays knocked back for the whole sequence. Letting it
      // back up to full while the picture was still opening put the brightest
      // thing on screen everywhere except inside the frame, which is backwards:
      // the photograph is the subject. By the time this turns off, the frame
      // covers the window and there is nothing behind it to see anyway.
      view.current.dim = p !== "ready";

      if (p === "ready") {
        view.current.unified = true;
        place(1);
        wakeRef.current?.();
        return;
      }

      if (p === "zoom") {
        if (!zoomStart) zoomStart = now;
        view.current.unified = true;
        place(reduced ? 1 : Math.min(1, (now - zoomStart) / ZOOM_MS));
      } else if (p === "shutter") {
        if (!shutterAt) shutterAt = now;
        zoomFrom.current = readLens(lensRef.current);
        view.current.unified = reduced || now - shutterAt >= HANDOVER_MS;
        place(0);
      } else {
        // Still following the glass, and there are still two skies.
        shutterAt = 0;
        zoomFrom.current = null;
        view.current.unified = false;
        place(0);
      }

      wakeRef.current?.();
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [place]);

  useEffect(() => {
    if (phase === "ready") notifyReady();
  }, [phase, notifyReady]);

  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  return (
    <main
      className="relative h-svh w-full overflow-hidden bg-sky-950"
      data-motion={motion ? "on" : "off"}
    >
      {/* The sky and the photograph of it are the same canvas, and it stays
          under the camera the whole way through, so the picture grows out of
          the glass while the camera dissolves off it. */}
      <StarField paused={!motion} view={view} wakeRef={wakeRef} />

      {/*
        The name follows you in. It is the same two lines that sat over the
        shutter button, moved to the corner once the map is up: the sky is the
        subject from here on, but a portfolio still has to say whose it is
        without making anyone open a card to find out.
      */}
      <header
        className="pointer-events-none absolute top-6 left-6 z-40 transition-all duration-1000 ease-expo sm:top-8 sm:left-8"
        style={{
          opacity: phase === "ready" ? 1 : 0,
          transform: `translateY(${phase === "ready" ? 0 : -10}px)`,
        }}
      >
        <h1 className="text-lg font-semibold tracking-[0.22em] text-star uppercase [text-shadow:0_2px_22px_rgb(0_0_0/0.9)] sm:text-xl">
          {identity.name}
        </h1>
        <Headline className="mt-1.5 justify-start font-mono text-[10px] tracking-[0.2em] text-muted uppercase [text-shadow:0_2px_16px_rgb(0_0_0/0.9)] sm:text-[11px]" />
      </header>

      <Constellations onOpen={open} revealed={phase === "ready"} />

      <CameraGate phase={phase} onEnter={enter} lensRef={lensRef} />

      {/* The shutter click is the gesture browsers want before they will let
          anything make a sound, so the radio starts on the way in. */}
      <Radio start={phase !== "rise" && phase !== "gate"} visible={phase === "ready"} />

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

/** Where the glass is on screen right now, in viewport pixels. */
function readLens(el: SVGCircleElement | null) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  return {
    cx: r.x + r.width / 2,
    cy: r.y + r.height / 2,
    r: (r.width / 2) * APERTURE_INSET,
  };
}
