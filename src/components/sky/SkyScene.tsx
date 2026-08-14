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
    <main className="relative h-svh w-full overflow-hidden bg-sky-950">
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
        <StarField dim={!entering} zoom={entering ? 1 : 1.16} />
      </div>

      <Constellations onOpen={open} revealed={phase === "ready"} />

      <CameraGate phase={phase} onEnter={enter} />
    </main>
  );
}
