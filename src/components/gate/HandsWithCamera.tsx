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
 * One finger: wide at the knuckle, tapering to a rounded tip, drooping slightly.
 *
 * Rounded rectangles were the last thing making these read as machinery. A rect
 * has the same width along its whole length and a finger does not, so four of
 * them side by side is a grille no matter how the spacing varies.
 */
function finger(bx: number, tx: number, cy: number, bh: number, th: number, droop: number) {
  const mx = (bx + tx) / 2;
  const dir = tx > bx ? 1 : -1;
  return [
    `M ${bx} ${cy - bh}`,
    `Q ${mx} ${cy - bh * 0.9 + droop * 0.45} ${tx - dir * th} ${cy - th + droop}`,
    `A ${th} ${th} 0 0 ${dir > 0 ? 1 : 0} ${tx - dir * th} ${cy + th + droop}`,
    `Q ${mx} ${cy + bh * 0.9 + droop * 0.45} ${bx} ${cy + bh}`,
    "Z",
  ].join(" ");
}

export function HandsWithCamera({ className = "" }: { className?: string }) {
  // Fingers curl over the body edge at four heights.
  //
  // Length and vertical spacing both vary, and none of them reaches the lens.
  // Even bars of equal length read as a grille rather than a hand: real fingers
  // differ in length, sit at irregular intervals, and stop well short of the
  // glass because nobody grips a camera with their fingers over the front
  // element. The tilt gives each one the slight downward curl of a grip.
  const fingerRows = [
    { y: 101, w: 36, bh: 12.5, th: 8.5, droop: -3 },
    { y: 133, w: 43, bh: 13.5, th: 9.0, droop: -1 },
    { y: 167, w: 39, bh: 13.0, th: 8.5, droop: 2 },
    { y: 198, w: 30, bh: 11.5, th: 7.5, droop: 4 },
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
          <path key={`l${i}`} d={finger(148, 148 + f.w, f.y + f.bh, f.bh, f.th, f.droop)} />
        ))}

        {/* ---- right hand ---- */}
        <path d="M372 116 C 372 92, 350 80, 326 86 L 326 216 C 326 242, 346 258, 370 258 C 396 258, 414 238, 414 210 C 414 166, 394 132, 372 116 Z" />
        {/* index finger, reaching up to the shutter release */}
        <path d="M330 96 C 330 78, 300 62, 292 74 C 286 84, 300 92, 306 96 Z" />
        {fingerRows.map((f, i) => (
          <path key={`r${i}`} d={finger(332, 332 - f.w, f.y + f.bh, f.bh, f.th, f.droop)} />
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
            d={finger(148, 148 + f.w * 0.9, f.y + f.bh - f.bh * 0.72, f.bh * 0.26, f.th * 0.22, f.droop)}
            fill="url(#camRim)"
          />
        ))}
        {fingerRows.map((f, i) => (
          <path
            key={`rh${i}`}
            d={finger(332, 332 - f.w * 0.9, f.y + f.bh - f.bh * 0.72, f.bh * 0.26, f.th * 0.22, f.droop)}
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
