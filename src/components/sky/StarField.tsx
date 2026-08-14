"use client";

import { useEffect, useRef } from "react";

type FieldStar = {
  x: number;
  y: number;
  r: number;
  b: number;
  rate: number;
  phase: number;
  depth: number;
  /** Index into STAR_COLOURS, so the bloom sprite can be looked up. */
  col: number;
};

type Nebula = {
  x: number;
  y: number;
  /** Radius as a fraction of the diagonal. */
  r: number;
  col: [number, number, number];
  alpha: number;
  /** Drift speed and phase, so the clouds breathe rather than sit still. */
  rate: number;
  phase: number;
};

type Shooter = { x: number; y: number; vx: number; vy: number; life: number; max: number };

/**
 * The photograph: a window onto the same sky, at its own scale.
 *
 * It is a real thing on screen from the first frame, sitting in the glass of
 * the lens, and the shutter does not create it. All the shutter does is start
 * it opening out. That continuity is the point: a picture that appears out of
 * nowhere after a flash is two events, and a picture that was already in the
 * lens and then grows is one.
 */
export type SkyPhoto = {
  /** How compressed the sky is inside the frame. 1 is life size. */
  scale: number;
  /** Frame in canvas pixels. A square with a radius of half its side is a circle. */
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  /** Once the frame covers the window there is no point drawing anything under it. */
  full: boolean;
};

export type SkyView = {
  /** Scale of the sky behind the camera, about the middle of the window. */
  ambient: number;
  /** Knocked back while the camera is still up, so the picture in the lens reads. */
  dim: boolean;
  photo: SkyPhoto | null;
  /**
   * Whether the whole window is the photograph.
   *
   * While the camera is up there are genuinely two skies: the real one behind
   * it, and the compressed one in the glass. That is what a lens is, and at the
   * size of a coin it reads as one.
   *
   * It does not survive being enlarged. Once the frame is a third of the window
   * the two are the same stars at different scales meeting along a hard edge,
   * and the eye reads that as two pictures rather than one thing being zoomed
   * into. So from the shutter on there is only ever one sky, drawn at the
   * frame's own scale, and the frame stops being a clip: it becomes the line
   * where the darkening around it ends. Nothing to disagree with itself.
   */
  unified: boolean;
};

/** Real star colours run from cool blue-white through to warm amber. */
const STAR_COLOURS: [number, number, number][] = [
  [255, 252, 245],
  [255, 252, 245],
  [255, 252, 245],
  [201, 221, 255],
  [166, 199, 255],
  [255, 226, 178],
  [255, 198, 143],
  [231, 190, 255],
];

const BLOOM_PX = 64;

/**
 * One soft disc per star colour, drawn once and stamped thereafter.
 *
 * About a fifth of the field is bright enough to bloom, which was a
 * createRadialGradient per star per frame: a hundred and some gradient objects
 * built and thrown away sixty times a second, and double that now the sky is
 * drawn twice, once behind the camera and once inside the lens. Stamping a
 * sprite costs nothing by comparison.
 */
function bloomSprites(): HTMLCanvasElement[] {
  return STAR_COLOURS.map(([r, g, b]) => {
    const c = document.createElement("canvas");
    c.width = c.height = BLOOM_PX;
    const x = c.getContext("2d");
    if (!x) return c;
    const mid = BLOOM_PX / 2;
    const grad = x.createRadialGradient(mid, mid, 0, mid, mid, mid);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    x.fillStyle = grad;
    x.fillRect(0, 0, BLOOM_PX, BLOOM_PX);
    return c;
  });
}

/**
 * Background sky, and the photograph of it.
 *
 * Canvas 2D. The interactive constellations are real DOM on top of this, so
 * nothing here needs to be clicked, focused or read.
 *
 * The nebulae are what stop this reading as black with white dots. They are
 * drawn additively so overlapping clouds add rather than occlude, which is how
 * emission nebulae actually photograph on a long exposure.
 */
export function StarField({
  paused = false,
  view,
  wakeRef,
}: {
  paused?: boolean;
  /** Read fresh every frame, so the caller can drive it without re-rendering. */
  view?: React.RefObject<SkyView>;
  /** Filled with a function that asks for one frame, for when the loop is idle. */
  wakeRef?: React.RefObject<(() => void) | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPaused = useRef(paused);
  const viewRef = useRef(view);
  const wake = useRef<() => void>(() => {});

  // Pausing holds the clock rather than stopping the loop mid frame, so the
  // field resumes from where it froze instead of jumping.
  useEffect(() => {
    isPaused.current = paused;
    wake.current();
  }, [paused]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Hand the caller a way to ask for a frame. It matters when the loop is idle,
  // which is any time the sky is paused or motion is reduced: the view can
  // still change under it and nothing would redraw.
  useEffect(() => {
    const slotRef = wakeRef;
    if (!slotRef) return;
    slotRef.current = () => wake.current();
    return () => {
      slotRef.current = null;
    };
  }, [wakeRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const blooms = bloomSprites();

    let w = 0;
    let h = 0;
    let diag = 0;
    let stars: FieldStar[] = [];
    let nebulae: Nebula[] = [];
    let shooters: Shooter[] = [];
    let raf = 0;
    let disposed = false;
    let nextShooter = 2.5;
    let last = 0;
    let clock = 0;

    const build = () => {
      // offsetWidth, not getBoundingClientRect. A bounding rect includes
      // ancestor transforms, and this used to sit inside a wrapper that scaled,
      // so it built a 1670x1044 backing store for a 1440x900 box. The observer
      // watches the untransformed border box and never fired to correct it.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, canvas.offsetWidth || Math.round(canvas.getBoundingClientRect().width));
      h = Math.max(1, canvas.offsetHeight || Math.round(canvas.getBoundingClientRect().height));
      diag = Math.hypot(w, h);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // The galactic band runs corner to corner. Stars near it are denser and
      // brighter, which is the strongest single cue that this is a galaxy and
      // not a random scatter of dots.
      const bandAngle = -0.42;
      const nx = Math.sin(bandAngle);
      const ny = -Math.cos(bandAngle);

      const count = Math.round((w * h) / 2100);
      stars = Array.from({ length: count }, () => {
        let x = Math.random() * w;
        let y = Math.random() * h;

        if (Math.random() < 0.62) {
          const along = (Math.random() - 0.5) * diag;
          // Three uniforms averaged approximates a normal, so the band has
          // soft edges rather than a hard boundary.
          const across =
            ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * h * 0.85;
          x = w / 2 + -ny * along + nx * across;
          y = h / 2 + nx * along + ny * across;
        }

        const depth = Math.random();
        return {
          x,
          y,
          r: 0.3 + depth * 1.25,
          b: 0.16 + depth * 0.74,
          rate: 0.4 + Math.random() * 1.7,
          phase: Math.random() * Math.PI * 2,
          depth,
          col: (Math.random() * STAR_COLOURS.length) | 0,
        };
      });

      nebulae = [
        { x: 0.22, y: 0.24, r: 0.42, col: [96, 58, 176], alpha: 0.3, rate: 0.05, phase: 0 },
        { x: 0.7, y: 0.34, r: 0.38, col: [188, 62, 140], alpha: 0.24, rate: 0.04, phase: 1.7 },
        { x: 0.48, y: 0.52, r: 0.5, col: [40, 96, 190], alpha: 0.26, rate: 0.03, phase: 3.1 },
        { x: 0.8, y: 0.68, r: 0.34, col: [28, 150, 158], alpha: 0.2, rate: 0.045, phase: 4.4 },
        { x: 0.16, y: 0.74, r: 0.34, col: [206, 132, 60], alpha: 0.16, rate: 0.035, phase: 5.6 },
        { x: 0.55, y: 0.14, r: 0.3, col: [150, 70, 200], alpha: 0.18, rate: 0.05, phase: 2.4 },
      ];
    };

    /**
     * One pass of sky, in whatever transform is already on the context.
     *
     * detail drops the expensive parts when the sky is drawn small enough that
     * nobody could see them. Inside the lens a star's bloom is a fraction of a
     * pixel, and paying for it twice a frame is the difference between this
     * being free and being felt.
     *
     * scale is what the context is about to shrink everything by, and stars
     * divide it back out. Positions compress, sizes do not. Scaled honestly
     * they land at a third of a pixel and the glass reads as empty, and it is
     * also just wrong: a wider lens packs more stars into the frame, it does
     * not make each one smaller. They are points of light either way.
     */
    const paintSky = (time: number, detail: boolean, meteors: boolean, scale = 1) => {
      const keep = 1 / scale;
      const base = ctx.createLinearGradient(0, h, 0, 0);
      base.addColorStop(0, "#0a0f22");
      base.addColorStop(0.5, "#060a18");
      base.addColorStop(1, "#03050f");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // --- nebulae, additive so overlaps brighten ---
      ctx.globalCompositeOperation = "lighter";
      for (const n of nebulae) {
        const breathe = reduced ? 1 : 1 + 0.12 * Math.sin(time * n.rate * 6 + n.phase);
        const cx = n.x * w + (reduced ? 0 : Math.sin(time * n.rate + n.phase) * 26);
        const cy = n.y * h + (reduced ? 0 : Math.cos(time * n.rate * 0.8 + n.phase) * 16);
        const rad = n.r * diag * 0.5 * breathe;
        const [r, g, b] = n.col;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${n.alpha})`);
        grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${n.alpha * 0.35})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- stars ---
      for (const s of stars) {
        const flicker = reduced
          ? 1
          : // Deeper modulation than a gentle shimmer: the two detuned waves
            // beat against each other so each star flashes on its own schedule
            // rather than breathing in time with the rest of the field.
            0.5 +
            0.5 *
              (0.55 * Math.sin(time * s.rate + s.phase) +
                0.45 * Math.sin(time * s.rate * 2.7 + s.phase * 1.7));

        const x = s.x + (reduced ? 0 : Math.sin(time * 0.03 + s.phase) * s.depth * 7);
        const alpha = Math.max(0, s.b * flicker);
        const [r, g, b] = STAR_COLOURS[s.col];

        ctx.beginPath();
        ctx.arc(x, s.y, s.r * keep, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();

        if (detail && s.depth > 0.8) {
          const rad = s.r * 9 * keep;
          ctx.globalAlpha = alpha * 0.3;
          ctx.drawImage(blooms[s.col], x - rad, s.y - rad, rad * 2, rad * 2);
          ctx.globalAlpha = 1;
        }
      }

      // --- meteors, rare enough to feel like luck rather than decoration ---
      if (meteors) {
        for (const m of shooters) {
          const fade = Math.sin(Math.min(1, m.life / m.max) * Math.PI);
          const len = 120 + 90 * fade;
          const norm = Math.hypot(m.vx, m.vy) || 1;
          const tx = m.x - (m.vx / norm) * len;
          const ty = m.y + (m.vy / norm) * len;

          const trail = ctx.createLinearGradient(m.x, m.y, tx, ty);
          trail.addColorStop(0, `rgba(255, 250, 240, ${0.85 * fade})`);
          trail.addColorStop(1, "rgba(255, 250, 240, 0)");
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.6 * keep;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const draw = (t: number) => {
      const frameDt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      // The clock only advances when running, so a pause freezes the sky where
      // it stands and resuming picks the phase back up rather than snapping to
      // wherever a wall clock had got to.
      const held = isPaused.current;
      const dt = held ? 0 : frameDt;
      clock += dt;
      const time = clock;

      if (!reduced && !held) {
        nextShooter -= dt;
        if (nextShooter <= 0) {
          nextShooter = 3.5 + Math.random() * 7;
          const speed = 420 + Math.random() * 380;
          const ang = 2.5 + Math.random() * 0.5;
          shooters.push({
            x: Math.random() * w * 0.9,
            y: Math.random() * h * 0.45,
            vx: Math.cos(ang) * speed,
            vy: -Math.sin(ang) * speed * 0.55,
            life: 0,
            max: 0.9 + Math.random() * 0.5,
          });
        }
        for (const m of shooters) {
          m.life += dt;
          m.x += m.vx * dt;
          m.y -= m.vy * dt;
        }
        shooters = shooters.filter((m) => m.life < m.max);
      }

      const v = viewRef.current?.current;
      const photo = v?.photo ?? null;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#04070f";
      ctx.fillRect(0, 0, w, h);

      if (v?.unified && photo) {
        // One sky, at the frame's scale, filling the window.
        ctx.save();
        ctx.translate(photo.x + photo.w / 2, photo.y + photo.h / 2);
        ctx.scale(photo.scale, photo.scale);
        ctx.translate(-w / 2, -h / 2);
        paintSky(time, true, !reduced, photo.scale);
        ctx.restore();

        // Everything outside the frame, held down. Even-odd so the frame is a
        // hole in the darkening rather than a second thing drawn over the top.
        if (!photo.full) {
          const r = Math.max(0, Math.min(photo.r, photo.w / 2, photo.h / 2));
          ctx.beginPath();
          ctx.rect(0, 0, w, h);
          ctx.roundRect(photo.x, photo.y, photo.w, photo.h, r);
          ctx.fillStyle = "rgba(3, 6, 14, 0.82)";
          ctx.fill("evenodd");
        }

        return;
      }

      const behind = !photo?.full;

      if (behind) {
        const a = v?.ambient ?? 1;
        ctx.save();
        if (Math.abs(a - 1) > 0.0005) {
          ctx.translate(w / 2, h / 2);
          ctx.scale(a, a);
          ctx.translate(-w / 2, -h / 2);
        }
        paintSky(time, true, !reduced);
        ctx.restore();

        // Knocked back here rather than with a CSS filter, because a filter on
        // the canvas would take the picture in the lens down with it, and that
        // picture is meant to be the brightest thing on screen.
        if (v?.dim) {
          ctx.fillStyle = "rgba(3, 6, 14, 0.55)";
          ctx.fillRect(0, 0, w, h);
        }
      }

      if (photo) {
        ctx.save();
        ctx.beginPath();
        const r = Math.max(0, Math.min(photo.r, photo.w / 2, photo.h / 2));
        ctx.roundRect(photo.x, photo.y, photo.w, photo.h, r);
        ctx.clip();

        // The middle of the frame is the middle of the picture at every size,
        // so the frame can open out without the image sliding around inside it.
        ctx.translate(photo.x + photo.w / 2, photo.y + photo.h / 2);
        ctx.scale(photo.scale, photo.scale);
        ctx.translate(-w / 2, -h / 2);

        paintSky(time, true, !behind && !reduced, photo.scale);
        ctx.restore();
      }
    };

    const loop = (t: number) => {
      if (disposed) return;
      draw(t);
      if (reduced || isPaused.current) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    wake.current = () => {
      if (!raf && !disposed) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    build();
    const ro = new ResizeObserver(() => {
      build();
      // Setting canvas.width clears the bitmap, so a stopped loop would leave
      // the field black. Ask for one frame.
      if (!raf && !disposed) raf = requestAnimationFrame(loop);
    });
    ro.observe(canvas);

    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !raf && !disposed) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      wake.current = () => {};
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
