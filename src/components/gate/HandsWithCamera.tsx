/**
 * Hands holding a camera up at the sky, seen from in front of the lens.
 *
 * Three things had to be got right, and all three were learned by rendering it
 * and looking rather than by reasoning about the code.
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
 * Silhouette needs specifics. What says camera is the pentaprism hump, the top
 * plate stepping back from the body, the mode dial breaking the top edge, and a
 * lens with a barrel and a rim rather than a flat disc.
 */

/** Nearly black. The hands are closest to the viewer, so they take the least sky. */
const HAND_FILL = "currentColor";
const TOP_FILL = "#0b1220";
const GLASS_FILL = "#050910";
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
 * between them.
 *
 * The right hand is this mirrored about x=240 rather than a second set of
 * numbers, so the two can never drift apart.
 */
const HAND =
  "M 172 96 C 150 90, 128 104, 122 130 C 116 152, 116 174, 122 192 " +
  "C 126 204, 128 214, 126 224 L 62 300 L 138 300 " +
  "C 154 272, 170 250, 180 232 L 188 200 L 186 96 Z";

/**
 * Thumb, hooked up out of the heel of the hand. Its tip finishes below the
 * bottom of the camera against open sky, because a thumb drawn entirely inside
 * the palm's own outline changes nothing except where the rim light falls.
 */
const THUMB =
  "M 140 236 C 134 223, 141 211, 155 207 C 170 203, 188 204, 195 211 " +
  "C 199 216, 195 222, 187 224 C 174 227, 159 232, 150 237 " +
  "C 145 240, 142 239, 140 236 Z";

/** Outer contour of the hand, lit by the sky behind it. */
const HAND_RIM =
  "M 160 92 C 142 90, 127 106, 122 130 C 116 152, 116 174, 122 192 " +
  "C 126 204, 128 214, 126 224 L 76 284";

/** Where the thumb crosses in front of the palm. */
const THUMB_RIM =
  "M 140 236 C 134 223, 141 211, 155 207 C 170 203, 188 204, 195 211";

/** The fold at the wrist, which is what sells the narrowing as anatomy. */
const WRIST_CREASE = "M 106 250 C 126 264, 148 268, 166 260";

/**
 * One finger, swept along a curved spine.
 *
 * The straight tapered version read as a tab sticking out sideways, because a
 * finger gripping something does not travel in a straight line: it arcs over
 * the edge and curls down onto the far face. So the outline is generated rather
 * than drawn. A quadratic spine runs from knuckle to tip, and the edge is that
 * spine offset along its own normal by a half width that tapers and then rounds
 * off at the very end.
 *
 * bow is how far the spine arcs above its chord, and it wants to be small. At
 * 15 every finger became a crescent and the two hands read as gills. Even 8 was
 * too much. A finger wrapping onto a front face is close to straight, and the
 * curl lives almost entirely in the last third.
 */
type Spine = [
  bx: number,
  by: number,
  tx: number,
  ty: number,
  bh: number,
  th: number,
  bow: number,
];

function sweep(
  bx: number,
  by: number,
  tx: number,
  ty: number,
  bh: number,
  th: number,
  bow: number,
) {
  const cx = (bx + tx) / 2;
  const cy = (by + ty) / 2 - bow;

  const N = 12;
  const top: string[] = [];
  const bottom: string[] = [];

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const mt = 1 - t;

    const px = mt * mt * bx + 2 * mt * t * cx + t * t * tx;
    const py = mt * mt * by + 2 * mt * t * cy + t * t * ty;

    // Tangent of the quadratic, so the offset is perpendicular to the spine
    // wherever it happens to be pointing.
    const dx = 2 * mt * (cx - bx) + 2 * t * (tx - cx);
    const dy = 2 * mt * (cy - by) + 2 * t * (ty - cy);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    // Taper from knuckle to tip, then a circular falloff over the last stretch
    // so the end is a dome rather than a chopped-off wedge.
    const w = bh + (th - bh) * t;
    const wr = w * Math.sqrt(Math.max(0, 1 - Math.pow(t, 8)));

    top.push(`${(px + nx * wr).toFixed(1)} ${(py + ny * wr).toFixed(1)}`);
    bottom.push(`${(px - nx * wr).toFixed(1)} ${(py - ny * wr).toFixed(1)}`);
  }

  return { top, bottom };
}

/** The closed outline, for the fill. */
function finger(...a: Spine): string {
  const { top, bottom } = sweep(...a);
  return `M ${top.join(" L ")} L ${[...bottom].reverse().join(" L ")} Z`;
}

/**
 * The lit edge alone.
 *
 * Stroking the whole closed outline was what made the fingers read as vents cut
 * into the camera: a form outlined all the way round is a sticker, not a solid.
 * Light arrives from one direction, so only the side facing it catches any.
 */
function fingerLit(...a: Spine): string {
  return `M ${sweep(...a).top.join(" L ")}`;
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
  { y: 107, w: 44, bh: 9.0, th: 5.5, curl: 15, bow: 5 },
  { y: 133, w: 46, bh: 10.0, th: 6.0, curl: 17, bow: 6 },
  { y: 157, w: 45, bh: 9.0, th: 5.5, curl: 15, bow: 5 },
  { y: 178, w: 36, bh: 7.5, th: 4.5, curl: 10, bow: 4 },
];

/** Knuckle bases, level with the body edge so the fingers come from behind it. */
const LEFT_KNUCKLE = 150;
const RIGHT_KNUCKLE = 330;

/**
 * The right index reaches up to the shutter release instead of wrapping, which
 * is where it sits on a camera about to be fired. So the right hand shows three
 * wrapping fingers and this one, and the left shows four.
 */
const SHUTTER_FINGER: Spine = [336, 116, 300, 90, 8.5, 5, 9];

export function HandsWithCamera({ className = "" }: { className?: string }) {
  const leftWraps = FINGERS;
  // The right index is on the shutter, so it does not also wrap the edge.
  const rightWraps = FINGERS.slice(1);

  const spine = (
    bx: number,
    dir: 1 | -1,
    f: (typeof FINGERS)[number],
  ): Spine => [bx, f.y, bx + dir * f.w, f.y + f.curl, f.bh, f.th, f.bow];

  const MIRROR = "translate(480 0) scale(-1 1)";

  return (
    <svg viewBox="0 0 480 300" className={className} aria-hidden>
      <defs>
        {/* Sky light catching the top edges, so the shape is a silhouette
            against the sky rather than a hole cut out of it. */}
        <linearGradient id="camRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe0ff" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#cfe0ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="handRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe0ff" stopOpacity="0.52" />
          <stop offset="55%" stopColor="#cfe0ff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#cfe0ff" stopOpacity="0" />
        </linearGradient>
        {/* The body falls off downward. A single flat tone across this much
            area reads as a slab, not as something with a lit top. */}
        <linearGradient id="bodyFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1120" />
          <stop offset="52%" stopColor="#060b15" />
          <stop offset="100%" stopColor="#03060d" />
        </linearGradient>
        <radialGradient id="lensGlow">
          <stop offset="35%" stopColor="#7fa6f0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7fa6f0" stopOpacity="0" />
        </radialGradient>
        {/* Off centre, the way a sky sits in a coated front element. */}
        <radialGradient id="lensGlint" cx="0.34" cy="0.28" r="0.78">
          <stop offset="0%" stopColor="#a9cbff" stopOpacity="0.44" />
          <stop offset="45%" stopColor="#7a9ce0" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#6f92d8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Nobody holds a camera level. Two degrees is enough to stop this
          reading as an icon and start reading as something in someone's
          hands, and it is small enough that the mirrored right hand still
          lines up with the left. */}
      <g transform="rotate(-2.2 240 210)">
        {/* ---- hands, behind the camera so the body covers what it should ---- */}
        <g fill={HAND_FILL}>
          <path d={HAND} />
          <path d={THUMB} />
          <g transform={MIRROR}>
            <path d={HAND} />
            <path d={THUMB} />
          </g>
        </g>

        {/* ---- camera ---- */}
        <g>
          {/* behind the body, so they merge into it at the seam */}
          <path d={PRISM} fill={TOP_FILL} />
          <circle cx="198" cy="92" r="9" fill={TOP_FILL} />
          <rect
            x="290"
            y="84"
            width="26"
            height="13"
            rx="6.5"
            fill={TOP_FILL}
          />

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
          <circle
            cx={LENS.cx}
            cy={LENS.cy}
            r={LENS.barrel}
            fill={BARREL_FILL}
          />
          <circle cx={LENS.cx} cy={LENS.cy} r={LENS.r} fill={GLASS_FILL} />
        </g>

        {/* ---- fingers, in front of the camera and darker for it ---- */}
        <g fill={HAND_FILL}>
          {leftWraps.map((f, i) => (
            <path key={`l${i}`} d={finger(...spine(LEFT_KNUCKLE, 1, f))} />
          ))}
          {rightWraps.map((f, i) => (
            <path key={`r${i}`} d={finger(...spine(RIGHT_KNUCKLE, -1, f))} />
          ))}
          <path d={finger(...SHUTTER_FINGER)} />
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

          {/* glass: a rim, a sheen, and one small specular */}
          <circle cx={LENS.cx} cy={LENS.cy} r={LENS.r} fill="url(#lensGlint)" />
          <ellipse
            cx="219"
            cy="127"
            rx="10"
            ry="4"
            transform="rotate(-42 219 127)"
            fill="#cfe0ff"
            opacity="0.2"
          />
          <circle
            cx={LENS.cx}
            cy={LENS.cy}
            r={LENS.r}
            stroke="#b8d4ff"
            strokeOpacity="0.44"
            strokeWidth="1.3"
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
            { key: "r", t: MIRROR },
          ].map((side) => (
            <g key={side.key} transform={side.t}>
              <path d={HAND_RIM} stroke="url(#handRim)" strokeWidth="2" />
              <path
                d={THUMB_RIM}
                stroke="#b8d4ff"
                strokeOpacity="0.2"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d={WRIST_CREASE}
                stroke="#b8d4ff"
                strokeOpacity="0.16"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Sky along the top of each finger, and nothing along the bottom. */}
          {[
            ...leftWraps.map((f, i) => ({
              k: `le${i}`,
              d: fingerLit(...spine(LEFT_KNUCKLE, 1, f)),
            })),
            ...rightWraps.map((f, i) => ({
              k: `re${i}`,
              d: fingerLit(...spine(RIGHT_KNUCKLE, -1, f)),
            })),
            { k: "shutter", d: fingerLit(...SHUTTER_FINGER) },
          ].map((p) => (
            <path
              key={p.k}
              d={p.d}
              stroke="#b8d4ff"
              strokeOpacity="0.34"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
