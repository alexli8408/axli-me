/**
 * Hands holding a camera up at the sky, seen from where the photographer
 * stands.
 *
 * The first attempt at this was one merged blob, and the reason is worth
 * recording: a silhouette does not read from its outline alone, it reads from
 * negative space. Fingers drawn as one continuous mass against a body of the
 * same fill have no boundary between them, so the eye gets a shape with no
 * internal structure. Here every finger is a separate rounded form with a real
 * gap between it and its neighbours, and the sky showing through those gaps is
 * what makes the hands legible.
 *
 * The camera itself is drawn as the icon rather than in strict perspective:
 * boxy body, prism hump, big centred lens. That silhouette is recognised
 * instantly, and a perspectivally correct camera pointed away from the viewer
 * would just be a dark rectangle.
 */
/**
 * One finger, swept along a curved spine.
 *
 * The straight tapered version still read as a tab sticking out sideways,
 * because a finger gripping something does not travel in a straight line: it
 * arcs up over the edge and curls down onto the far face. So the outline here
 * is generated rather than drawn. A quadratic spine runs from knuckle to tip,
 * and the edge is that spine offset along its own normal by a half width that
 * tapers and then rounds off at the very end.
 *
 * bow  how far the spine arcs above its chord, which is the curl
 * curl how far below the knuckle the tip finishes
 */
function finger(
  bx: number,
  by: number,
  tx: number,
  ty: number,
  bh: number,
  th: number,
  bow: number,
): string {
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

  return `M ${top.join(" L ")} L ${bottom.reverse().join(" L ")} Z`;
}

export function HandsWithCamera({ className = "" }: { className?: string }) {
  // Fingers curl over the body edge at four heights.
  //
  // Length and vertical spacing both vary, and none of them reaches the lens.
  // Even bars of equal length read as a grille rather than a hand: real fingers
  // differ in length, sit at irregular intervals, and stop well short of the
  // glass because nobody grips a camera with their fingers over the front
  // element. The tilt gives each one the slight downward curl of a grip.
  // Index down to little finger: each shorter than the last, each curling a
  // bit harder, the way a hand closes.
  const fingerRows = [
    { y: 108, w: 40, bh: 12.0, th: 7.0, curl: 13, bow: 9 },
    { y: 141, w: 46, bh: 13.0, th: 7.5, curl: 15, bow: 11 },
    { y: 175, w: 42, bh: 12.5, th: 7.0, curl: 15, bow: 10 },
    { y: 206, w: 32, bh: 11.0, th: 6.5, curl: 13, bow: 8 },
  ];

  return (
    <svg viewBox="0 0 480 300" className={className} aria-hidden>
      <defs>
        {/* Sky light catching the top edges, so the shape is a silhouette
            against the sky rather than a hole cut out of it. */}
        <linearGradient id="camRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe0ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#cfe0ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lensGlint" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#b8d4ff" stopOpacity="0.4" />
          <stop offset="45%" stopColor="#b8d4ff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#b8d4ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g fill="currentColor">
        {/* ---- camera ---- */}
        <rect x="142" y="88" width="196" height="118" rx="17" />
        <rect x="206" y="60" width="72" height="32" rx="9" />
        <rect x="296" y="72" width="30" height="15" rx="7.5" />
        <circle cx="240" cy="147" r="54" />

        {/* ---- left hand ---- */}
        {/* back of the hand, wrapping the left side and running off the body */}
        <path d="M108 116 C 108 92, 130 80, 154 86 L 154 216 C 154 242, 134 258, 110 258 C 84 258, 66 238, 66 210 C 66 166, 86 132, 108 116 Z" />
        {/* thumb, hooked under the body */}
        <path d="M96 214 C 86 232, 92 252, 110 256 C 126 260, 140 250, 140 234 L 140 212 Z" />
        {fingerRows.map((f, i) => (
          <path
            key={`l${i}`}
            d={finger(148, f.y, 148 + f.w, f.y + f.curl, f.bh, f.th, f.bow)}
          />
        ))}

        {/* ---- right hand ---- */}
        <path d="M372 116 C 372 92, 350 80, 326 86 L 326 216 C 326 242, 346 258, 370 258 C 396 258, 414 238, 414 210 C 414 166, 394 132, 372 116 Z" />
        {/* index finger, reaching up to the shutter release */}
        <path d="M330 96 C 330 78, 300 62, 292 74 C 286 84, 300 92, 306 96 Z" />
        {fingerRows.map((f, i) => (
          <path
            key={`r${i}`}
            d={finger(332, f.y, 332 - f.w, f.y + f.curl, f.bh, f.th, f.bow)}
          />
        ))}

        {/* ---- forearms, cropped by the bottom of the frame ---- */}
        <path d="M74 236 L 150 236 L 168 300 L 56 300 Z" />
        <path d="M330 236 L 406 236 L 424 300 L 312 300 Z" />
      </g>

      {/* ---- light ---- */}
      <g>
        <rect x="206" y="60" width="72" height="5" rx="2.5" fill="url(#camRim)" />
        <rect x="142" y="88" width="196" height="5" rx="2.5" fill="url(#camRim)" />
        <rect x="112" y="90" width="42" height="4" rx="2" fill="url(#camRim)" />
        <rect x="326" y="90" width="42" height="4" rx="2" fill="url(#camRim)" />
        {/* a highlight riding the top of each knuckle */}
        {fingerRows.map((f, i) => (
          <path
            key={`lh${i}`}
            d={finger(148, f.y - f.bh * 0.62, 148 + f.w * 0.86, f.y + f.curl - f.th * 0.6, f.bh * 0.22, f.th * 0.18, f.bow)}
            fill="url(#camRim)"
          />
        ))}
        {fingerRows.map((f, i) => (
          <path
            key={`rh${i}`}
            d={finger(332, f.y - f.bh * 0.62, 332 - f.w * 0.86, f.y + f.curl - f.th * 0.6, f.bh * 0.22, f.th * 0.18, f.bow)}
            fill="url(#camRim)"
          />
        ))}
        {/* the sky in the glass */}
        <circle cx="240" cy="147" r="54" fill="url(#lensGlint)" />
        <circle
          cx="240"
          cy="147"
          r="54"
          fill="none"
          stroke="#b8d4ff"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}
