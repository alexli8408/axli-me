"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraGate, type GatePhase } from "@/components/gate/CameraGate";
import { useSectionOverlays } from "@/components/overlay/SectionOverlays";
import { Constellations } from "./Constellations";
import { StarField } from "./StarField";

/** The camera rises on load, then the visitor drives the rest. */
const RISE_MS = 1500;
const PUSH_MS = 820;
const SHUTTER_MS = 150;
const ZOOM_MS = 1200;

export function SkyScene() {
  const [phase, setPhase] = useState<GatePhase>("rise");
  const [motion, setMotion] = useState(true);
  const { open, notifyReady } = useSectionOverlays();
  const timers = useRef<number[]>([]);

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
        The sky sits slightly pushed in and dimmed behind the viewfinder, then
        settles back as the frame opens. The push happens inside the canvas, not
        as a transform on this wrapper: scaling a full-viewport element hands it
        its own composited layer, and the raster for that layer comes back short
        at the right and bottom edges. The constellations never move with it, so
        their coordinates stay in plain viewport space and the hit targets never
        have to be corrected for anything.
      */}
      <div className="absolute inset-0">
        <StarField dim={!entering} zoom={entering ? 1 : 1.16} paused={!motion} />
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
        className="absolute right-4 bottom-4 z-30 rounded-full border border-line p-2.5 text-faint transition-all duration-500 ease-expo hover:border-line-strong hover:text-star focus-visible:opacity-100"
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
