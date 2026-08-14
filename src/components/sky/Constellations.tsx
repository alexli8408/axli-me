"use client";

import { useState } from "react";
import {
  centroid,
  constellations,
  labelAnchor,
  spread,
  type Constellation,
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
    <div
      className="absolute inset-0 transition-opacity duration-1000 ease-expo"
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
          <ConstellationShape key={c.id} c={c} active={active === c.id} />
        ))}
      </svg>

      <nav aria-label="Sections" className="absolute inset-0">
        <ul className="contents">
          {constellations.map((c) => (
            <li key={c.id}>
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

/** The drawn shape: lines first, then stars on top of them. */
function ConstellationShape({ c, active }: { c: Constellation; active: boolean }) {
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
          // Non-scaling stroke, otherwise preserveAspectRatio="none" stretches
          // the line weight along with the coordinates and the verticals come
          // out visibly thicker than the horizontals.
          vectorEffect="non-scaling-stroke"
          strokeWidth={active ? 1.1 : 0.7}
          className={
            active
              ? "text-ember-400/70 transition-all duration-500 ease-expo"
              : "text-star/22 transition-all duration-500 ease-expo"
          }
        />
      ))}

      {c.stars.map((s, i) => (
        <g key={i}>
          {/* Bloom, sized off the star's own magnitude. */}
          <circle
            cx={s.x}
            cy={s.y}
            r={0.001}
            stroke="currentColor"
            vectorEffect="non-scaling-stroke"
            strokeWidth={(active ? 15 : 9) * s.mag}
            className={
              active
                ? "text-ember-400/16 transition-all duration-500 ease-expo"
                : "text-star/10 transition-all duration-500 ease-expo"
            }
            fill="none"
          />
          <circle
            cx={s.x}
            cy={s.y}
            r={0.001}
            stroke="currentColor"
            vectorEffect="non-scaling-stroke"
            strokeWidth={(active ? 5.2 : 4.0) * s.mag}
            className={
              active
                ? "text-star transition-all duration-500 ease-expo"
                : "text-star/85 transition-all duration-500 ease-expo"
            }
            fill="none"
          />
        </g>
      ))}
    </g>
  );
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
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl focus-visible:outline-offset-4"
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
            {c.title === "Alex Li" ? "About" : c.label}
          </span>
        </span>
      </a>

      {/* Star names, revealed only on hover so the resting sky stays quiet. */}
      {c.stars.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 font-mono text-[9px] tracking-[0.18em] whitespace-nowrap text-ember-400/80 uppercase transition-all duration-500 ease-expo"
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            marginTop: "0.85rem",
            opacity: active ? 1 : 0,
            transitionDelay: active ? `${i * 45}ms` : "0ms",
          }}
        >
          {s.label}
        </span>
      ))}
    </>
  );
}
