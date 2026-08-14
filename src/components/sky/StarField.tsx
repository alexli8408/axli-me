"use client";

import { useEffect, useRef } from "react";

type FieldStar = {
  x: number;
  y: number;
  r: number;
  /** Base brightness. */
  b: number;
  /** Twinkle rate and phase. */
  rate: number;
  phase: number;
  /** Parallax depth, 0 far and 1 near. */
  depth: number;
  hue: "warm" | "cold" | "plain";
};

/**
 * Background star field.
 *
 * Canvas 2D on purpose. The interactive constellations are real SVG elements
 * sitting on top of this, so nothing here needs to be clicked, focused or read.
 * That split is what makes this version far simpler than driving hit targets
 * off a shader: the decorative half is pixels, the functional half is DOM, and
 * neither has to know about the other.
 */
export function StarField({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  /** Set by the render effect, so unpausing can restart a stopped loop. */
  const kickRef = useRef<(() => void) | null>(null);

  // Mirrored into a ref so the render loop reads the latest value without being
  // torn down and rebuilt every time it flips. Unpausing has to kick the loop
  // as well: it stops itself when paused, and updating a ref does not wake it.
  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) kickRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let stars: FieldStar[] = [];
    let raf = 0;
    let disposed = false;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      // Cap the ratio: this is a field of 1px dots, and rendering it at 3x on a
      // phone costs a lot for detail nobody can resolve.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density by area, so a wide monitor is not sparser than a phone.
      const count = Math.round((w * h) / 5200);
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        const roll = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          // Nearer stars are bigger and brighter, which is what sells depth.
          r: 0.35 + depth * 1.15,
          b: 0.18 + depth * 0.62,
          rate: 0.4 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          depth,
          hue: roll > 0.88 ? "cold" : roll > 0.76 ? "warm" : "plain",
        };
      });
    };

    build();
    const ro = new ResizeObserver(() => {
      build();
      // Setting canvas.width clears the bitmap. When the loop is stopped, for
      // reduced motion or while paused, nothing would ever repaint it and the
      // field goes black, so ask for a single frame here.
      if (!raf && !disposed) raf = requestAnimationFrame(loop);
    });
    ro.observe(canvas);

    const draw = (t: number) => {
      const time = t / 1000;

      // The sky is not flat black. A faint gradient reads as atmosphere near
      // the horizon and gives the field somewhere to sit.
      const grad = ctx.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, "#0a1020");
      grad.addColorStop(0.45, "#060b16");
      grad.addColorStop(1, "#04070f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        // Twinkle is atmospheric scintillation, so it should be irregular
        // rather than a clean sine. Two detuned waves is enough to break it up.
        const flicker = reduced
          ? 1
          : 0.72 +
            0.28 *
              (0.6 * Math.sin(time * s.rate + s.phase) +
                0.4 * Math.sin(time * s.rate * 2.7 + s.phase * 1.7));

        // Very slow drift, nearer stars moving more.
        const drift = reduced ? 0 : Math.sin(time * 0.02 + s.phase) * s.depth * 6;
        const x = s.x + drift;
        const alpha = Math.max(0, s.b * flicker);

        ctx.beginPath();
        ctx.arc(x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle =
          s.hue === "cold"
            ? `rgba(184, 212, 255, ${alpha})`
            : s.hue === "warm"
              ? `rgba(255, 226, 178, ${alpha})`
              : `rgba(253, 250, 242, ${alpha})`;
        ctx.fill();

        // The brightest few get a soft bloom, the way a fast lens renders them.
        if (s.depth > 0.86) {
          const g = ctx.createRadialGradient(x, s.y, 0, x, s.y, s.r * 7);
          g.addColorStop(0, `rgba(253, 250, 242, ${alpha * 0.24})`);
          g.addColorStop(1, "rgba(253, 250, 242, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, s.y, s.r * 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (t: number) => {
      if (disposed) return;
      draw(t);
      // Reduced motion draws one frame and stops. Paused does the same.
      if (reduced || pausedRef.current) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    kickRef.current = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !raf && !disposed) {
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      kickRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
