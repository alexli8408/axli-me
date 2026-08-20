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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // The clip lives inside a closed <dialog>, which is display:none, so
    // autoplay alone will not start it: there is nothing to play until the card
    // opens. Watching for it to actually take up space is what catches that,
    // and pausing it again on the way out keeps three clips from decoding in a
    // card that only ever shows one of them at a time.
    //
    // It deliberately does not follow the sky's pause button. An earlier
    // version tried, by looking for a [data-motion] ancestor, and that ancestor
    // is not there: the cards are not inside the element that carries it, so
    // closest() returned null and the check passed every time. Rather than
    // reach further for it, this is the behaviour worth having. The sky is
    // decoration and pausing it is a preference; a demo of a project is the
    // content someone opened the card to see, and it is muted, ten seconds
    // long, and only playing while the card is open.
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) el.pause();
        else void el.play().catch(() => {});
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
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
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
