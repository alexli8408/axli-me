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

/** The band's own colours: cold blues through teal, with violet at the edges. */
const CLOUD: [number, number, number][] = [
  [38, 78, 178],
  [30, 104, 176],
  [34, 138, 172],
  [52, 170, 184],
  [74, 66, 170],
  [122, 68, 156],
];

/**
 * The galaxy, painted once into its own canvas.
 *
 * Every cloud here used to be a createRadialGradient inside the frame loop,
 * which put a hard ceiling on how many there could be: six, because six was
 * what the budget allowed, and six soft discs is a wash rather than a galaxy.
 * None of it moves, so none of it needs to be redrawn. Painted once and
 * stamped, the count stops mattering and the band can be built the way one
 * actually looks: a broad haze, brighter knots along its length, and dark
 * rifts cut back out of it.
 *
 * The rifts are the part that reads. A band that only ever adds light is a
 * smear; what makes it a galaxy is the dust in front of it, which is why these
 * are drawn over the top in the colour of the empty sky rather than the band
 * being drawn around them.
 */
function paintBackdrop(w: number, h: number, dpr: number, nx: number, ny: number, diag: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const b = c.getContext("2d");
  if (!b) return c;
  b.setTransform(dpr, 0, 0, dpr, 0, 0);

  const ground = b.createLinearGradient(0, h, 0, 0);
  ground.addColorStop(0, "#070d20");
  ground.addColorStop(0.55, "#050916");
  ground.addColorStop(1, "#03060f");
  b.fillStyle = ground;
  b.fillRect(0, 0, w, h);

  // A point t along the band's axis, then off across it.
  const at = (t: number, off: number) => ({
    x: w / 2 + -ny * t + nx * off,
    y: h / 2 + nx * t + ny * off,
  });

  const blob = (x: number, y: number, r: number, col: number[], a: number, soft = 0.45) => {
    const g = b.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${a})`);
    g.addColorStop(soft, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${a * 0.32})`);
    g.addColorStop(1, `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0)`);
    b.fillStyle = g;
    b.beginPath();
    b.arc(x, y, r, 0, Math.PI * 2);
    b.fill();
  };

  const spread = () => ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 2;

  b.globalCompositeOperation = "lighter";

  // The haze the whole band sits in.
  for (let i = 0; i < 30; i++) {
    const p = at((i / 29 - 0.5) * diag * 1.15, spread() * h * 0.15);
    blob(p.x, p.y, diag * (0.1 + Math.random() * 0.06), [22, 46, 108], 0.062);
  }

  // Knots along it. Denser toward the middle, which is where a galactic core
  // would be, and the reason the band is not the same brightness end to end.
  for (let i = 0; i < 86; i++) {
    const t = spread() * diag * 0.62;
    const p = at(t, spread() * h * 0.22);
    const col = CLOUD[(Math.random() * CLOUD.length) | 0];
    const core = 1 - Math.min(1, Math.abs(t) / (diag * 0.5));
    blob(p.x, p.y, diag * (0.022 + Math.random() * 0.055), col, 0.06 + core * 0.1);
  }

  // One warm corner, because a sky that is blue everywhere is a gradient.
  blob(w * 0.94, h * 0.9, diag * 0.28, [188, 132, 74], 0.12);

  // Dust in front, in the colour of the sky behind it.
  b.globalCompositeOperation = "source-over";
  for (let i = 0; i < 26; i++) {
    const t = spread() * diag * 0.66;
    const p = at(t, spread() * h * 0.2);
    blob(p.x, p.y, diag * (0.022 + Math.random() * 0.06), [4, 7, 17], 0.4 + Math.random() * 0.32, 0.35);
  }

  // The faint majority. These never twinkle: they are below the size where a
  // change in brightness is visible at all, and there are thousands of them,
  // so they belong in the picture rather than in the loop.
  const dust = Math.round((w * h) / 380);
  for (let i = 0; i < dust; i++) {
    let x = Math.random() * w;
    let y = Math.random() * h;
    if (Math.random() < 0.72) {
      const p = at((Math.random() - 0.5) * diag * 1.1, spread() * h * 0.26);
      x = p.x;
      y = p.y;
    }
    if (x < -2 || y < -2 || x > w + 2 || y > h + 2) continue;
    const t = Math.random();
    const [r, g, bl] = STAR_COLOURS[(Math.random() * STAR_COLOURS.length) | 0];
    b.fillStyle = `rgba(${r}, ${g}, ${bl}, ${0.12 + t * 0.62})`;
    b.beginPath();
    b.arc(x, y, 0.18 + t * 0.5, 0, Math.PI * 2);
    b.fill();
  }

  return c;
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
    let backdrop: HTMLCanvasElement | null = null;
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

      backdrop = paintBackdrop(w, h, dpr, nx, ny, diag);

      // Far fewer than there used to be, and every one of them bright. The
      // density now lives in the backdrop, so what is left in the loop is only
      // the stars big enough that a viewer can actually see them flicker.
      const count = Math.round((w * h) / 5200);
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
          r: 0.45 + depth * 1.45,
          b: 0.3 + depth * 0.7,
          rate: 0.4 + Math.random() * 1.7,
          phase: Math.random() * Math.PI * 2,
          depth,
          col: (Math.random() * STAR_COLOURS.length) | 0,
        };
      });

      // Three, where there were six, and they are no longer the nebulae: the
      // band is in the backdrop and cannot move. These are just slow veils
      // passing over it, so the sky is never quite the same twice.
      nebulae = [
        { x: 0.28, y: 0.3, r: 0.46, col: [46, 96, 190], alpha: 0.1, rate: 0.028, phase: 0 },
        { x: 0.66, y: 0.44, r: 0.42, col: [40, 150, 172], alpha: 0.085, rate: 0.022, phase: 2.3 },
        { x: 0.5, y: 0.76, r: 0.4, col: [116, 68, 168], alpha: 0.075, rate: 0.019, phase: 4.6 },
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

      // The whole galaxy in one stamp: ground, band, dust lanes and the
      // thousands of faint stars, all of which were fixed the moment the
      // window stopped resizing.
      if (backdrop) ctx.drawImage(backdrop, 0, 0, w, h);

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

      if (v?.unified && (!photo || photo.full)) {
        // The frame is the whole window, so there is no frame: draw the sky
        // plainly and touch none of the geometry.
        //
        // This is not just a shortcut. The frame is authored in viewport pixels
        // and consumed here in canvas pixels, and the driver stops running once
        // the sequence is over, so the frame is frozen at whatever the window
        // was at that moment while this canvas keeps resizing under it. Placing
        // by it afterwards drew the sky offset by half the difference and left
        // a bare band down the edge, permanently, on any resize or rotation.
        // At full size there is nothing to place, so nothing can go stale.
        paintSky(time, true, !reduced, 1);
        return;
      }

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
        const r = Math.max(0, Math.min(photo.r, photo.w / 2, photo.h / 2));
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.roundRect(photo.x, photo.y, photo.w, photo.h, r);
        ctx.fillStyle = "rgba(3, 6, 14, 0.82)";
        ctx.fill("evenodd");

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
