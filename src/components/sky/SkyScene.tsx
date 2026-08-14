"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraGate, type GatePhase } from "@/components/gate/CameraGate";
import { useSectionOverlays } from "@/components/overlay/SectionOverlays";
import { Constellations } from "./Constellations";
import { StarField } from "./StarField";

/** Shutter blink, then the push into the frame. */
const SHUTTER_MS = 110;
const ZOOM_MS = 1100;

export function SkyScene() {
  const [phase, setPhase] = useState<GatePhase>("gate");
  const { open, notifyReady } = useSectionOverlays();
  const timers = useRef<number[]>([]);

  // Both timers are scheduled here rather than from an effect keyed on phase.
  // Doing it in an effect meant the cleanup fired the moment phase became
  // "zoom" and cancelled the timer that was going to set "ready", so the
  // sequence stalled one step short and the constellations never appeared.
  const enter = useCallback(() => {
    setPhase((p) => {
      if (p !== "gate") return p;
      timers.current.push(
        window.setTimeout(() => setPhase("zoom"), SHUTTER_MS),
        window.setTimeout(() => setPhase("ready"), SHUTTER_MS + ZOOM_MS),
      );
      return "shutter";
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

  const entering = phase !== "gate";

  return (
    <main className="relative h-svh w-full overflow-hidden bg-sky-950">
      {/*
        The sky sits slightly pushed in and dimmed behind the viewfinder, then
        settles back as the frame opens. Scaling the sky rather than scaling the
        constellations keeps their coordinates in plain viewport space, so the
        hit targets never have to be corrected for a transform.
      */}
      <div
        className="absolute inset-0 transition-all ease-expo"
        style={{
          transform: entering ? "scale(1)" : "scale(1.14)",
          filter: entering ? "brightness(1)" : "brightness(0.55)",
          transitionDuration: `${ZOOM_MS}ms`,
        }}
      >
        <StarField paused={phase === "gate"} />
      </div>

      <Constellations onOpen={open} revealed={phase === "ready"} />

      <CameraGate phase={phase} onEnter={enter} />
    </main>
  );
}
