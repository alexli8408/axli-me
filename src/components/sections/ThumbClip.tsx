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
    // opens. Watching for it to actually take up space is what catches that.
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) el.pause();
        else if (allowed()) void el.play().catch(() => {});
      },
      { threshold: 0.1 },
    );
    io.observe(el);

    // The sky has a pause button, and pausing the sky should pause this too.
    // Following that rather than the media query means one visible control
    // governs every moving thing on the page, and the button already starts in
    // the right position for someone who asked their system for less motion.
    const host = el.closest("[data-motion]");
    const allowed = () => host?.getAttribute("data-motion") !== "off";

    const apply = () => {
      if (!allowed()) el.pause();
      else if (el.getBoundingClientRect().width > 0) void el.play().catch(() => {});
    };

    const mo = host
      ? new MutationObserver(apply)
      : null;
    mo?.observe(host!, { attributes: true, attributeFilter: ["data-motion"] });

    apply();
    return () => {
      io.disconnect();
      mo?.disconnect();
    };
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
