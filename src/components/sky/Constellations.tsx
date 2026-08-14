"use client";

import { useState } from "react";
import {
  centroid,
  constellations,
  labelAnchor,
  spread,
  type Constellation,
  type Star,
} from "@/lib/sky";

/**
 * Interactive constellations, drawn as SVG over the canvas star field.
 *
 * Real DOM elements rather than shader output, so focus, hover, keyboard and
 * screen readers all work for free and the markup is crawlable. The previous
 * version of this site had to sync DOM hit targets to shader uniforms every
 * frame to get the same result; here the geometry simply is the DOM.
 *
 * The whole constellation is one button. Individual stars are decorative marks
 * inside it, because asking someone to hit a 6px circle is a bad target and the
 * items are all in the card anyway.
 */
export function Constellations({
  onOpen,
  revealed,
}: {
  onOpen: (id: string) => void;
  revealed: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);

  return (
    // z-40 puts the map above the sky, which climbs to z-30 once the photo is
    // growing. pointer-events are off for the whole layer and back on for the
    // links alone: a full-viewport layer above the gate would otherwise eat
    // the click on the shutter button underneath it.
    <div
      className="pointer-events-none absolute inset-0 z-40 transition-opacity duration-1000 ease-expo"
      style={{ opacity: revealed ? 1 : 0 }}
      inert={!revealed}
    >
      {/* viewBox in normalised units, preserveAspectRatio none so the map
          stretches with the viewport exactly like the coordinates say. */}
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden
        className="absolute inset-0 h-full w-full"
      >
        {constellations.map((c) => (
          <ConstellationLines key={c.id} c={c} active={active === c.id} />
        ))}
      </svg>

      <nav aria-label="Sections" className="absolute inset-0">
        <ul className="contents">
          {constellations.map((c) => (
            <li key={c.id}>
              <ConstellationStars c={c} active={active === c.id} />
              <ConstellationButton
                c={c}
                active={active === c.id}
                onEnter={() => setActive(c.id)}
                onLeave={() => setActive((v) => (v === c.id ? null : v))}
                onOpen={() => onOpen(c.id)}
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Deterministic pseudo-random from a star's own coordinates.
 *
 * Not Math.random: this runs during render, and a value that differs between
 * the server and the client is a hydration mismatch. Same input, same star,
 * every time.
 */
function jitter(x: number, y: number, salt: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * The joining lines only.
 *
 * The stars themselves are NOT drawn here. This SVG uses a 1x1 viewBox with
 * preserveAspectRatio="none" so the normalised coordinates land exactly where
 * they say, but that scales x by the width and y by the height independently,
 * which turns every circle into an ellipse squashed by the viewport's aspect
 * ratio. Lines survive it because non-scaling-stroke keeps their weight uniform
 * and only their endpoints matter. Circles do not, so they are plain DOM
 * elements in the layer above, where a pixel is a pixel in both axes.
 */
function ConstellationLines({ c, active }: { c: Constellation; active: boolean }) {
  return (
    <g>
      {c.lines.map(([a, b], i) => (
        <line
          key={i}
          x1={c.stars[a].x}
          y1={c.stars[a].y}
          x2={c.stars[b].x}
          y2={c.stars[b].y}
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
          strokeWidth={active ? 1.1 : 0.7}
          className={
            active
              ? "text-ember-400/70 transition-all duration-500 ease-expo"
              : "text-star/22 transition-all duration-500 ease-expo"
          }
        />
      ))}
    </g>
  );
}

/** Star dots, as DOM so they stay round at any aspect ratio. */
function ConstellationStars({ c, active }: { c: Constellation; active: boolean }) {
  return (
    <>
      {c.stars.map((s, i) => {
        // Bright stars scintillate slowly, faint ones faster, the way seeing
        // actually behaves. The negative delay desyncs them from each other.
        const dur = 2.1 + jitter(s.x, s.y, 1) * 3.6 + s.mag * 1.2;
        const delay = -jitter(s.x, s.y, 2) * 8;
        const core = (active ? 7.4 : 6.0) * s.mag;
        const halo = (active ? 26 : 17) * s.mag;

        return (
          <span key={i} aria-hidden>
            <span
              data-twinkle
              className="pointer-events-none absolute rounded-full transition-all duration-500 ease-expo"
              style={{
                left: `${s.x * 100}%`,
                top: `${s.y * 100}%`,
                width: `${halo}px`,
                height: `${halo}px`,
                marginLeft: `${-halo / 2}px`,
                marginTop: `${-halo / 2}px`,
                background: `radial-gradient(circle, ${
                  active ? "rgba(246,217,155,0.5)" : "rgba(253,250,242,0.32)"
                } 0%, rgba(253,250,242,0) 70%)`,
                animation: `star-flare ${dur * 1.15}s ease-in-out ${delay}s infinite`,
              }}
            />
            <span
              data-twinkle
              className="pointer-events-none absolute rounded-full transition-all duration-500 ease-expo"
              style={{
                left: `${s.x * 100}%`,
                top: `${s.y * 100}%`,
                width: `${core}px`,
                height: `${core}px`,
                marginLeft: `${-core / 2}px`,
                marginTop: `${-core / 2}px`,
                background: active ? "var(--color-star)" : "rgba(253,250,242,0.9)",
                boxShadow: active
                  ? "0 0 10px 2px rgba(246,217,155,0.6)"
                  : "0 0 6px 1px rgba(253,250,242,0.35)",
                animation: `star-twinkle ${dur}s ease-in-out ${delay}s infinite`,
              }}
            />
          </span>
        );
      })}
    </>
  );
}

/**
 * Where a star's name goes.
 *
 * Every label used to hang straight below its star, which put half of them on
 * top of the joining lines and, in the wider shapes, on top of each other. They
 * are pushed away from the middle of their own constellation instead, so they
 * radiate outward and land in empty sky.
 *
 * x and y are fractions of two different edges, so a direction taken from them
 * raw is skewed by the viewport. Weighting x by a typical aspect is enough to
 * pick the right side, which is all this has to do.
 */
const LABEL_ASPECT = 1.6;

function labelPlacement(s: Star, mid: { x: number; y: number }) {
  const dx = (s.x - mid.x) * LABEL_ASPECT;
  const dy = s.y - mid.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;

  // Clearly to one side: sit beside the star. Otherwise above or below it.
  if (Math.abs(ux) > 0.5) {
    return {
      transform: ux > 0 ? "translateY(-50%)" : "translate(-100%, -50%)",
      marginLeft: `${ux > 0 ? 13 : -13}px`,
      marginTop: "0px",
    };
  }
  return {
    transform: "translateX(-50%)",
    marginLeft: "0px",
    marginTop: dy >= 0 ? "0.9rem" : "-1.5rem",
  };
}

/**
 * The hit target and the labels. Positioned in percentages so it tracks the
 * same normalised coordinates the SVG uses.
 */
function ConstellationButton({
  c,
  active,
  onEnter,
  onLeave,
  onOpen,
}: {
  c: Constellation;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onOpen: () => void;
}) {
  const mid = centroid(c);
  const label = labelAnchor(c);

  return (
    <>
      <a
        href={c.href}
        onClick={(e) => {
          // Leave modified clicks to the browser.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          onOpen();
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        aria-label={`${c.label}: ${c.title}`}
        // The hit area covers the shape; the name sits below it.
        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl focus-visible:outline-offset-4"
        style={{
          left: `${mid.x * 100}%`,
          top: `${mid.y * 100}%`,
          width: `${Math.max(spread(c) * 2.6, 0.16) * 100}%`,
          height: `${Math.max(spread(c) * 2.6, 0.16) * 100}%`,
        }}
      >
        <span
          className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-center whitespace-nowrap"
          style={{ top: `${((label.y - mid.y) / Math.max(spread(c) * 2.6, 0.16) + 0.5) * 100}%` }}
        >
          <span
            className="font-mono text-[10px] tracking-[0.32em] uppercase transition-colors duration-500 ease-expo"
            style={{ color: active ? "var(--color-ember-400)" : "var(--color-faint)" }}
          >
            {c.kicker}
          </span>
          <span
            className="text-sm font-medium tracking-[0.14em] uppercase transition-colors duration-500 ease-expo sm:text-base"
            style={{ color: active ? "var(--color-star)" : "var(--color-muted)" }}
          >
            {c.label}
          </span>
        </span>
      </a>

      {/* Star names, revealed only on hover so the resting sky stays quiet. */}
      {c.stars.map((s, i) => {
        const place = labelPlacement(s, mid);
        return (
          <span
            key={i}
            aria-hidden
            // No Tailwind translate class here. Tailwind v4 emits `translate`
            // as its own property, which composes with `transform` rather than
            // losing to it, so the two together shift the label twice.
            className="pointer-events-none absolute font-mono text-[9px] tracking-[0.18em] whitespace-nowrap text-ember-400/80 uppercase transition-opacity duration-500 ease-expo"
            style={{
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              ...place,
              opacity: active ? 1 : 0,
              transitionDelay: active ? `${i * 45}ms` : "0ms",
            }}
          >
            {s.label}
          </span>
        );
      })}
    </>
  );
}
