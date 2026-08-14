"use client";

import { useEffect, useRef } from "react";

/**
 * A silent looping clip in a thumbnail frame.
 *
 * A video rather than a GIF. The same ten seconds is about two megabytes as
 * VP9 and about five as a GIF, and the GIF is the one that looks worse: it is
 * capped at 256 colours, so photographic footage bands and dithers.
 *
 * Two sources because the split is still real. Chrome and Firefox take the
 * WebM, Safari takes the mp4, and the browser picks without downloading both.
 */
export function ThumbClip({ webm, mp4, poster, alt }: {
  webm: string;
  mp4: string;
  poster: string;
  alt: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  // A clip that loops forever is exactly the kind of motion the reduced motion
  // setting is asking about, and CSS cannot pause a video. Held on the poster
  // frame instead, so the entry still shows what the project looks like.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches) el.pause();
      else void el.play().catch(() => {});
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <video
      ref={ref}
      poster={poster}
      aria-label={alt}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
