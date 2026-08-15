/**
 * Hands holding a camera up at the sky, seen from in front of the lens.
 *
 * Everything here was learned by rendering it and looking, not by reasoning
 * about the code.
 *
 * Edges separate forms, not tone. Everything was one fill to begin with, so the
 * fingers vanished into the camera body and all that survived of them was the
 * highlight along each knuckle, which read as claw marks. Lightening the body
 * to fix that was worse: dark fingers on a light panel read as vents cut into
 * it. Backlit against a sky, all of this is genuinely near-black, and what
 * separates one form from another is the thin line of sky each edge catches. So
 * the fills stay within a few values of each other and the rim lights carry it.
 *
 * Occlusion does the composition. The hands are drawn before the camera, so the
 * body covers everything but the parts that genuinely stick out. That is what
 * you actually see from in front of a lens: fingers curled onto the front face,
 * a little of each hand past the edges, and forearms coming down below. Drawing
 * whole palms on either side was what made this look like a game controller,
 * because two symmetric masses flanking a rounded box is a game controller.
 *
 * Nothing about a hand is regular, and the first version that read as hands at
 * all still read as a machine's. Three things caused that, and all three are
 * about repetition: every finger was a cone with a linear taper, every finger
 * followed a single arc, and the right hand was the left one flipped exactly.
 * Fingers have joints, they straighten at the base and curl at the tip, and no
 * two hands match. See sweep, widthAt and RIGHT_VARIATION below.
 */

/**
 * Skin, at night, from in front.
 *
 * Flat near-black was the safe choice and it was the wrong one: with no tone of
 * its own, every finger was carried entirely by the rim light along its top
 * edge, which is why the pair read as machined rather than as hands. A single
 * flat brown is not the fix either, because a large area of one value is a
 * paper cutout whatever colour it is.
 *
 * So it is a gradient, in viewBox units rather than per shape, which matters:
 * with objectBoundingBox each finger would get its own copy of the ramp and
 * they would all shade identically. In user space the whole hand shares one
 * light, so the knuckles nearest the sky are warmest and the forearm falls away
 * into the dark as it comes toward the viewer and away from the sky.
 */
const HAND_FILL = "url(#handSkin)";
const TOP_FILL = "#0b1220";
const BARREL_FILL = "#070c16";

const BODY = { x: 150, y: 96, w: 180, h: 96, r: 9 };
const LENS = { cx: 240, cy: 145, r: 33, barrel: 39 };
const PRISM = "M 206 100 L 218 66 L 262 66 L 274 100 Z";

/**
 * Left hand and forearm in one path, so there is no seam where they meet. Most
 * of this is hidden behind the camera. What shows is the outer edge past the
 * body, the thumb, and the arm below.
 *
 * The arm leaves through the bottom corner, not straight down. Two vertical
 * forearms under the camera met in the middle and read as a torso, which turned
 * the whole thing into a hooded figure. Anyone raising a camera has their
 * elbows out, so the arms spread as they descend and leave a wide gap of sky
 * between them. Its edges are curves, not the straight lines they started as:
 * at rest that passed, but the push scales all of this to 2.15 and a straight
 * edge that long reads as a paper cutout.
 *
 * The heel is not one clean arc either. It carries a shallow dip where the
 * palm meets the base of the little finger, because an outline made of two
 * perfect curves is the outline of a mitten.
 */
const HAND =
  "M 172 96 C 150 90, 128 103, 122 126 C 118 141, 116 152, 119 162 " +
  "C 121 172, 116 180, 121 192 C 126 204, 128 214, 126 224 " +
  "C 116 246, 92 274, 62 300 C 44 318, 30 348, 26 380 L 118 380 " +
  "C 126 350, 132 322, 138 300 " +
  "C 154 272, 170 250, 180 232 L 188 200 L 186 96 Z";

/**
 * Thumb, hooked up out of the heel of the hand. Its tip finishes below the
 * bottom of the camera against open sky, because a thumb drawn entirely inside
 * the palm's own outline changes nothing except where the rim light falls.
 */
const THUMB =
  "M 139 230 C 134 219, 140 208, 152 204 C 163 200, 176 201, 184 206 " +
  "C 189 209, 188 214, 182 216 C 172 219, 158 223, 149 229 " +
  "C 144 232, 141 233, 139 230 Z";

/** Outer contour of the hand, lit by the sky behind it. */
/**
 * Follows the hand's own outer edge, all the way to where the hand ends.
 *
 * It used to stop at y=284 while the arm carries on to 300, so the lit edge
 * simply ran out sixteen units short and left a bright line ending in mid air.
 * The wrist crease happened to finish at the same point, so the two met in a
 * hard corner and the whole lower arm read as sliced off. Same curve as HAND
 * from here on, so it cannot come up short again.
 */
const HAND_RIM =
  "M 160 92 C 142 90, 127 105, 122 126 C 118 141, 116 152, 119 162 " +
  "C 121 172, 116 180, 121 192 C 126 204, 128 214, 126 224 " +
  "C 116 246, 92 274, 62 300 C 44 318, 30 348, 26 380";

/** The fold at the wrist, which is what sells the narrowing as anatomy. */
const WRIST_CREASE = "M 110 252 C 128 265, 148 268, 164 261";

type Spine = [
  bx: number,
  by: number,
  tx: number,
  ty: number,
  bh: number,
  th: number,
  bow: number,
  hook: number,
];

type Sample = {
  t: number;
  px: number;
  py: number;
  nx: number;
  ny: number;
  wr: number;
};

/**
 * How thick a finger is along its length.
 *
 * A linear taper draws a cone, and four cones side by side are a machine part.
 * A finger narrows at each crease and swells over the bone between them, then
 * widens again into the pad behind the nail before it rounds off. Those bumps
 * are only a tenth of the width, but they are most of the difference between
 * this reading as a finger and reading as a peg.
 */
function widthAt(t: number, bh: number, th: number): number {
  const taper = bh + (th - bh) * t;
  const bump = (centre: number, spread: number) =>
    Math.exp(-Math.pow((t - centre) / spread, 2));

  const joints =
    1 -
    0.085 * bump(0.33, 0.1) - // first crease
    0.07 * bump(0.66, 0.095) + // second crease
    0.035 * bump(0.5, 0.12) + // the bone between them
    0.04 * bump(0.85, 0.11); // the pad

  // Round the very end off rather than chopping it square.
  return taper * joints * Math.sqrt(Math.max(0, 1 - Math.pow(t, 8)));
}

/**
 * Samples along a finger: a point, the normal there, and the half width.
 *
 * The spine is a cubic, not the quadratic it started as. A quadratic can only
 * bend one way over its whole length, so every finger came out as one even arc
 * and the hand read as a rack of identical hoops. A real finger leaves the
 * knuckle almost straight, lifts a little as it crosses the edge, and does
 * nearly all of its curling in the last third. Two control points is the least
 * that can say that.
 *
 * bow   lift near the base, where the finger crosses the body edge
 * hook  drop near the tip, which is the curl onto the front face
 */
function sweep(
  bx: number,
  by: number,
  tx: number,
  ty: number,
  bh: number,
  th: number,
  bow: number,
  hook: number,
): Sample[] {
  const dx = tx - bx;
  const dy = ty - by;
  const c1x = bx + dx * 0.28;
  const c1y = by + dy * 0.28 - bow;
  const c2x = bx + dx * 0.7;
  const c2y = by + dy * 0.7 - bow * 0.2 + hook;

  const N = 22;
  const out: Sample[] = [];

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const mt = 1 - t;

    const px =
      mt * mt * mt * bx +
      3 * mt * mt * t * c1x +
      3 * mt * t * t * c2x +
      t * t * t * tx;
    const py =
      mt * mt * mt * by +
      3 * mt * mt * t * c1y +
      3 * mt * t * t * c2y +
      t * t * t * ty;

    // Tangent, so the offset stays perpendicular to the spine wherever it
    // happens to be pointing.
    const ddx =
      3 * mt * mt * (c1x - bx) + 6 * mt * t * (c2x - c1x) + 3 * t * t * (tx - c2x);
    const ddy =
      3 * mt * mt * (c1y - by) + 6 * mt * t * (c2y - c1y) + 3 * t * t * (ty - c2y);
    const len = Math.hypot(ddx, ddy) || 1;

    out.push({
      t,
      px,
      py,
      nx: -ddy / len,
      ny: ddx / len,
      wr: widthAt(t, bh, th),
    });
  }

  return out;
}

const at = (s: Sample, off: number) =>
  `${(s.px + s.nx * off).toFixed(1)} ${(s.py + s.ny * off).toFixed(1)}`;

/** The closed outline, for the fill. */
function finger(spine: Spine): string {
  const pts = sweep(...spine);
  const top = pts.map((s) => at(s, s.wr));
  const bottom = pts.map((s) => at(s, -s.wr)).reverse();
  return `M ${top.join(" L ")} L ${bottom.join(" L ")} Z`;
}

/**
 * The lit edge, as a filled sliver rather than a stroke.
 *
 * Two reasons it is not a stroke. A stroke runs the whole way round, and a
 * shape outlined all the way round reads as a sticker rather than a solid, so
 * only the side facing the light gets one. And a stroke is one width for its
 * whole length, which is the giveaway: light along a curved edge is brightest
 * where the surface turns hardest and dies away at the ends. This tapers in
 * and out, so the highlight has somewhere to start and finish.
 */
function fingerLight(spine: Spine, weight = 2.4): string {
  const pts = sweep(...spine);
  const outer: string[] = [];
  const inner: string[] = [];

  for (const s of pts) {
    const fade = Math.pow(Math.sin(Math.PI * s.t), 0.6);
    const rw = Math.min(s.wr * 0.7, weight * fade);
    outer.push(at(s, s.wr));
    inner.push(at(s, s.wr - rw));
  }

  return `M ${outer.join(" L ")} L ${inner.reverse().join(" L ")} Z`;
}

/**
 * The turn under each finger, which is what makes it round.
 *
 * The lit edge alone only says where the light is. A cylinder needs the other
 * side too: the surface curving away into shadow underneath. Without it every
 * finger is a flat fill with a bright line on top, which is a painted stripe on
 * a slab, and four of them side by side is a grille again.
 *
 * Wider and softer than the highlight, because a terminator is always broader
 * than a specular, and it fades at both ends for the same reason the light
 * does: at the knuckle the finger is not yet turning, and at the tip it has
 * already turned.
 */
function fingerShade(spine: Spine, weight = 3.6): string {
  const pts = sweep(...spine);
  const outer: string[] = [];
  const inner: string[] = [];

  for (const s of pts) {
    const fade = Math.pow(Math.sin(Math.PI * s.t), 0.45);
    const rw = Math.min(s.wr * 0.9, weight * fade);
    outer.push(at(s, -s.wr));
    inner.push(at(s, -s.wr + rw));
  }

  return `M ${outer.join(" L ")} L ${inner.reverse().join(" L ")} Z`;
}

/**
 * Fingers wrapping the body edge, index at the top down to the little finger.
 *
 * Every tip stops short of the glass. Nobody grips a camera with their fingers
 * over the front element, and an earlier set crossed it by a few pixels, which
 * read as the hand being inside the camera. The lens is sized around that
 * clearance rather than the other way round, so the middle finger can stay the
 * longest of the four. It has to be: a hand with a short middle finger looks
 * wrong before you can say why.
 *
 * Lengths and spacing both vary. Even bars at even intervals read as a grille.
 */
const FINGERS = [
  { y: 107, w: 44, bh: 9.0, th: 5.5, curl: 15, bow: 7, hook: 5 },
  { y: 133, w: 46, bh: 10.0, th: 6.0, curl: 17, bow: 8, hook: 6 },
  { y: 157, w: 45, bh: 9.0, th: 5.5, curl: 15, bow: 7, hook: 5 },
  { y: 178, w: 36, bh: 7.5, th: 4.5, curl: 10, bow: 5, hook: 4 },
];

/**
 * The right hand is not the left one flipped.
 *
 * Mirroring a single table gave two hands identical to the pixel, and that is
 * the most machine-looking thing a drawing like this can do: real hands differ
 * from each other, and the eye reads perfect symmetry as manufacture long
 * before it can say why. These are small, a couple of pixels each, applied to
 * the right hand's three wrapping fingers. Fixed numbers rather than anything
 * random, so the drawing is the same every render and stays tunable.
 */
const RIGHT_VARIATION = [
  { dy: 2.5, dw: -3, dbow: 1, dhook: -1.5 },
  { dy: 1, dw: 2.5, dbow: -1.5, dhook: 1 },
  { dy: 3, dw: -2, dbow: 0.5, dhook: 2 },
];

/** Knuckle bases, level with the body edge so the fingers come from behind it. */
const LEFT_KNUCKLE = 150;
const RIGHT_KNUCKLE = 330;

/*
 * There was a fifth finger here, the right index reaching up to the shutter
 * release. It was right about how a camera is held and wrong about what this
 * drawing can show. Seen flat from the front, a finger on the top plate has to
 * be drawn above the body's outline, so it read as a loose shape hovering over
 * the camera rather than a finger resting on a button.
 *
 * Worse, taking that finger off the front face left the right hand with three
 * fingers and a gap where the fourth should be. The two hands stopped matching
 * in the one way that matters, and that gap is what kept reading as broken.
 * Both hands wrap all four now; the release is still drawn on the top plate.
 */

const MIRROR = "translate(480 0) scale(-1 1)";
/** Same mirror, plus a couple of degrees so the right hand sits at its own angle. */
const MIRROR_RIGHT = `${MIRROR} rotate(2 168 206)`;

type Variation = (typeof RIGHT_VARIATION)[number];

function spineFor(
  bx: number,
  dir: 1 | -1,
  f: (typeof FINGERS)[number],
  v?: Variation,
): Spine {
  const y = f.y + (v?.dy ?? 0);
  return [
    bx,
    y,
    bx + dir * (f.w + (v?.dw ?? 0)),
    y + f.curl,
    f.bh,
    f.th,
    f.bow + (v?.dbow ?? 0),
    f.hook + (v?.dhook ?? 0),
  ];
}

/**
 * Corner marks inside the glass, on the picture.
 *
 * They sit on the corners of the largest square that fits in the circle, which
 * is where the frame of the shot actually is: what the lens can see is round,
 * what comes out of it is not.
 */
const MARK = 33 * 0.7;
const MARK_ARM = 7;
const CORNER_MARKS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
]
  .map(([sx, sy]) => {
    const x = 240 + sx * MARK;
    const y = 145 + sy * MARK;
    return `M ${x - sx * 0} ${y + sy * -MARK_ARM} L ${x} ${y} L ${x - sx * MARK_ARM} ${y}`;
  })
  .join(" ");

export function HandsWithCamera({
  className = "",
  lensRef,
}: {
  className?: string;
  /** The sky measures this to know where to put the picture. */
  lensRef?: React.Ref<SVGCircleElement>;
}) {
  const leftWraps = FINGERS;
  // The right index is on the shutter, so it does not also wrap the edge.
  const rightWraps = FINGERS.slice(1);

  const spines: { k: string; s: Spine }[] = [
    ...leftWraps.map((f, i) => ({ k: `l${i}`, s: spineFor(LEFT_KNUCKLE, 1, f) })),
    ...rightWraps.map((f, i) => ({
      k: `r${i}`,
      s: spineFor(RIGHT_KNUCKLE, -1, f, RIGHT_VARIATION[i]),
    })),
  ];

  return (
    <svg viewBox="0 0 480 380" className={className} aria-hidden>
      <defs>
        {/* Sky light catching the top edges, so the shape is a silhouette
            against the sky rather than a hole cut out of it. */}
        <linearGradient id="camRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe0ff" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#cfe0ff" stopOpacity="0" />
        </linearGradient>
        {/* Gone well before the bottom of the arm, so the edge dies out rather
            than stopping. An edge that is still visible where its path ends
            reads as the arm being cut, whatever the arm is actually doing. */}
        <linearGradient id="handRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe0ff" stopOpacity="0.52" />
          <stop offset="45%" stopColor="#cfe0ff" stopOpacity="0.17" />
          <stop offset="72%" stopColor="#cfe0ff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#cfe0ff" stopOpacity="0" />
        </linearGradient>
        {/* The body falls off downward. A single flat tone across this much
            area reads as a slab, not as something with a lit top. */}
        <linearGradient id="bodyFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1120" />
          <stop offset="52%" stopColor="#060b15" />
          <stop offset="100%" stopColor="#03060d" />
        </linearGradient>
        {/*
          The hole for the glass.
          Setting the glass to fill="none" did nothing, because the body panel
          and the barrel are both opaque discs underneath it: not filling a
          shape does not remove what is already painted there. This cuts the
          circle out of the camera instead, so the sky behind actually shows.
        */}
        {/*
          The hand's own outline, so nothing drawn inside it can escape it.
          The wrist crease starts at x=106 and the hand's outer edge at that
          height is 114, so eight pixels of it were hanging in open sky.
        */}
        <clipPath id="handClip">
          <path d={HAND} />
          <path d={THUMB} />
        </clipPath>
        <mask id="glassHole">
          <rect x="0" y="0" width="480" height="380" fill="#fff" />
          <circle cx={LENS.cx} cy={LENS.cy} r={LENS.r} fill="#000" />
        </mask>
        {/* Warm at the top where the sky reaches it, almost gone by the elbow. */}
        <linearGradient id="handSkin" x1="0" y1="88" x2="0" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d99a76" />
          <stop offset="26%" stopColor="#c08260" />
          <stop offset="58%" stopColor="#95604a" />
          <stop offset="82%" stopColor="#6a4335" />
          <stop offset="100%" stopColor="#42291f" />
        </linearGradient>
        {/*
          Skin is not opaque. Lit from behind it passes red at the thin places,
          which is the single strongest cue that a shape is a hand and not a
          moulded part, and it is why the edge here is warm while the sky light
          on top of it stays cold.
        */}
        <radialGradient id="knuckleWarm" cx="152" cy="150" r="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffb489" stopOpacity="0.26" />
          <stop offset="55%" stopColor="#f0946a" stopOpacity="0.11" />
          <stop offset="100%" stopColor="#e08a5f" stopOpacity="0" />
        </radialGradient>
        {/*
          The wrist fold, fading out at both ends.

          It was a flat stroke of constant width in the same cold blue as the
          sky edges, running the full width of the arm and stopping dead at each
          end. That is a panel gap, which is exactly how it read. A crease in
          skin is darker than the skin around it rather than lighter, it is
          deepest in the middle, and it has no ends.
        */}
        {/*
          The forearm is a cylinder too, and it was the last flat thing left.
          The outer edge already catches the sky, so this is the other half:
          the inner side turning away from it, toward the body and the gap
          between the arms where no light comes from at all.
        */}
        <linearGradient id="armTurn" x1="34" y1="0" x2="192" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2b1409" stopOpacity="0" />
          <stop offset="48%" stopColor="#2b1409" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#2b1409" stopOpacity="0.44" />
        </linearGradient>
        <linearGradient id="creaseFade" x1="106" y1="0" x2="168" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4a2a1e" stopOpacity="0" />
          <stop offset="30%" stopColor="#4a2a1e" stopOpacity="0.42" />
          <stop offset="62%" stopColor="#4a2a1e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4a2a1e" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lensGlow">
          <stop offset="35%" stopColor="#7fa6f0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7fa6f0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Nobody holds a camera level. Two degrees is enough to stop this
          reading as an icon and start reading as something in someone's
          hands. */}
      <g transform="rotate(-2.2 240 210)">
        {/* ---- hands, behind the camera so the body covers what it should ---- */}
        <g fill={HAND_FILL}>
          <path d={HAND} />
          <path d={THUMB} />
          <g transform={MIRROR_RIGHT}>
            <path d={HAND} />
            <path d={THUMB} />
          </g>
        </g>

        {/* ---- camera ---- */}
        <g mask="url(#glassHole)">
          {/* behind the body, so they merge into it at the seam */}
          <path d={PRISM} fill={TOP_FILL} />
          <circle cx="198" cy="92" r="9" fill={TOP_FILL} />
          <rect x="290" y="84" width="26" height="13" rx="6.5" fill={TOP_FILL} />

          {/* top plate, stepping back from the front face */}
          <rect
            x={BODY.x}
            y={BODY.y}
            width={BODY.w}
            height="15"
            rx="6"
            fill={TOP_FILL}
          />
          <rect
            x={BODY.x}
            y={BODY.y + 8}
            width={BODY.w}
            height={BODY.h - 8}
            rx={BODY.r}
            fill="url(#bodyFace)"
          />

          {/* The front element takes the whole sky, so it is the one bright
              thing here and everything else reads against it. */}
          <circle
            cx={LENS.cx}
            cy={LENS.cy}
            r={LENS.barrel + 26}
            fill="url(#lensGlow)"
          />
          <circle cx={LENS.cx} cy={LENS.cy} r={LENS.barrel} fill={BARREL_FILL} />
          {/* Nothing to paint: the mask has already taken this circle out of
              everything above. It stays so the sky can measure where it is. */}
          <circle
            ref={lensRef}
            data-lens=""
            cx={LENS.cx}
            cy={LENS.cy}
            r={LENS.r}
            fill="none"
            pointerEvents="none"
          />
        </g>

        {/* ---- fingers, in front of the camera and darker for it ---- */}
        {/*
          A dark edge on each finger, which is contact shadow rather than
          outline: where two fingers touch, almost no light reaches the seam.
          Without it four fills of nearly the same value merge into one paddle
          and only the top highlight tells you how many fingers there are.
        */}
        <g fill={HAND_FILL} stroke="#3a2117" strokeOpacity="0.5" strokeWidth="0.9">
          {spines.map((p) => (
            <path key={p.k} d={finger(p.s)} />
          ))}
        </g>

        {/* ---- light ---- */}
        <g fill="none">
          <path d={PRISM} fill="url(#camRim)" opacity="0.28" />
          <path
            d="M 218 67 L 262 67"
            stroke="#cfe0ff"
            strokeOpacity="0.5"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x={BODY.x}
            y={BODY.y}
            width={BODY.w}
            height="3.5"
            rx="1.75"
            fill="url(#camRim)"
          />
          {/* The body gradient ends near the value of the sky behind it, so
              without this the camera dissolved at the bottom instead of
              stopping. Faint: it is the edge turning away from the light. */}
          <rect
            x={BODY.x + 10}
            y={BODY.y + BODY.h - 1.4}
            width={BODY.w - 20}
            height="1.4"
            rx="0.7"
            fill="#b8d4ff"
            opacity="0.07"
          />

          {/* Glass: a rim, one small specular, and the frame marks. The sheen
              that used to fill the disc is gone, because there is a picture
              under it now and a wash of blue over it is a veil. */}
          <ellipse
            cx="219"
            cy="127"
            rx="9"
            ry="3.5"
            transform="rotate(-42 219 127)"
            fill="#cfe0ff"
            opacity="0.16"
          />
          <path
            d={CORNER_MARKS}
            stroke="var(--color-ember-400)"
            strokeOpacity="0.85"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle
            cx={LENS.cx}
            cy={LENS.cy}
            r={LENS.r}
            stroke="#b8d4ff"
            strokeOpacity="0.5"
            strokeWidth="1.4"
          />
          <circle
            cx={LENS.cx}
            cy={LENS.cy}
            r={LENS.barrel}
            stroke="#b8d4ff"
            strokeOpacity="0.17"
            strokeWidth="1.1"
          />

          {/* Contour, thumb and wrist, on both hands. These are the internal
              edges: without them the palm and forearm are one dark shape. */}
          {[
            { key: "l", t: undefined },
            { key: "r", t: MIRROR_RIGHT },
          ].map((side) => (
            <g key={side.key} transform={side.t}>
              <path
                d={HAND_RIM}
                stroke="url(#handRim)"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              {/*
                The thumb has no rim any more. Seen from in front of the lens
                it sits inside the palm's own outline and never makes an edge,
                so lighting one left a hooked line hanging in the middle of the
                hand looking like a scratch. The shape stays: it still bulges
                the silhouette where the tip clears the body.
              */}
              <g clipPath="url(#handClip)">
                <rect x="0" y="0" width="480" height="380" fill="url(#armTurn)" />
                <rect x="0" y="0" width="480" height="380" fill="url(#knuckleWarm)" />
                <path
                  d={WRIST_CREASE}
                  stroke="url(#creaseFade)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </g>
            </g>
          ))}

          {/* Underside first, then the sky on top, so the light wins where they
              meet at the ends. */}
          {spines.map((p) => (
            <path key={`${p.k}-shade`} d={fingerShade(p.s)} fill="#40241a" opacity="0.55" />
          ))}
          {spines.map((p) => (
            <path key={`${p.k}-lit`} d={fingerLight(p.s)} fill="#ffd9bd" opacity="0.34" />
          ))}
        </g>
      </g>
    </svg>
  );
}
