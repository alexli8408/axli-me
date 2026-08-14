"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lofi Girl's synthwave radio, the stream with Lofi Boy and the dog.
 *
 * Playback stays inside YouTube's own player in a hidden iframe. Nothing is
 * hosted, downloaded or proxied here, which is both the only licensed way to
 * do this and the only way the artists get their play counted.
 *
 * The id is the fragile part. This is a 24/7 livestream and YouTube mints a
 * new id whenever the broadcast restarts, so one day this one will stop
 * resolving. When that happens the player reports an error rather than
 * throwing, and the control takes itself off screen instead of sitting there
 * doing nothing. Swapping the id below is the whole fix.
 */
const RADIO = {
  id: "4xDzrJKXOOY",
  title: "Synthwave radio",
  by: "Lofi Girl",
  href: "https://www.youtube.com/watch?v=4xDzrJKXOOY",
};

/** Quiet enough to sit under a portfolio rather than announce itself. */
const VOLUME = 32;
const FADE_MS = 1800;
const STORAGE_KEY = "axli:music";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  destroy: () => void;
};

type YTOptions = {
  videoId: string;
  host?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: () => void;
    onStateChange?: (e: { data: number }) => void;
    onError?: () => void;
  };
};

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: YTOptions) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoad: Promise<void> | null = null;

/**
 * Pull in the IFrame API, once, and not until someone actually wants sound.
 *
 * Deferring it keeps a third party script off the initial load entirely, which
 * matters more here than the few hundred milliseconds it costs later: most
 * visitors never press play, and the ones who do have already sat through a
 * shutter animation.
 */
function loadApi(): Promise<void> {
  if (apiLoad) return apiLoad;

  apiLoad = new Promise<void>((resolve, reject) => {
    if (window.YT?.Player) return resolve();

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onerror = () => reject(new Error("iframe_api blocked"));
    document.head.appendChild(tag);
  });

  return apiLoad;
}

export function Radio({ start, visible }: { start: boolean; visible: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const fade = useRef(0);
  const armed = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [broken, setBroken] = useState(false);

  /** Ramp in rather than cut in, so nothing lands on anyone like a slap. */
  const rampTo = useCallback((to: number) => {
    const p = player.current;
    if (!p) return;
    cancelAnimationFrame(fade.current);

    const from = to > 0 ? 0 : VOLUME;
    const t0 = performance.now();
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / FADE_MS);
      p.setVolume(from + (to - from) * u);
      if (u < 1) fade.current = requestAnimationFrame(step);
    };
    p.setVolume(from);
    fade.current = requestAnimationFrame(step);
  }, []);

  const build = useCallback(async () => {
    if (player.current || !hostRef.current) return;
    try {
      await loadApi();
    } catch {
      setBroken(true);
      return;
    }
    if (!window.YT?.Player || !hostRef.current) return;

    player.current = new window.YT.Player(hostRef.current, {
      videoId: RADIO.id,
      // nocookie, so a visitor who never presses play is never handed a
      // tracking cookie by a third party for the privilege of reading a CV.
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          rampTo(VOLUME);
          player.current?.playVideo();
        },
        // 1 is playing, 3 is buffering. Anything else is not making a sound.
        onStateChange: (e) => setPlaying(e.data === 1 || e.data === 3),
        onError: () => setBroken(true),
      },
    });
  }, [rampTo]);

  /**
   * Start on the way in.
   *
   * Browsers refuse to play audio until the page has been interacted with, and
   * the shutter button is that interaction. Once a document has been clicked
   * the permission sticks, so this does not have to happen inside the handler
   * itself and can wait for the API to arrive over the network.
   */
  useEffect(() => {
    if (!start || armed.current) return;
    armed.current = true;
    if (window.localStorage?.getItem(STORAGE_KEY) === "off") return;

    // Held off the commit rather than fired from it. Building an iframe and
    // fetching a third party script at the exact moment the shutter goes would
    // be competing with the zoom for the same frames, and the API takes a few
    // hundred milliseconds to arrive anyway, so the sound comes up around the
    // time the picture reaches the edges instead of during the scramble.
    const t = window.setTimeout(() => void build(), 600);
    return () => clearTimeout(t);
  }, [start, build]);

  useEffect(
    () => () => {
      cancelAnimationFrame(fade.current);
      player.current?.destroy();
      player.current = null;
    },
    [],
  );

  const toggle = () => {
    if (!player.current) {
      window.localStorage?.removeItem(STORAGE_KEY);
      void build();
      return;
    }
    if (playing) {
      player.current.pauseVideo();
      window.localStorage?.setItem(STORAGE_KEY, "off");
    } else {
      rampTo(VOLUME);
      player.current.playVideo();
      window.localStorage?.removeItem(STORAGE_KEY);
    }
  };

  return (
    <>
      {/*
        The player itself. Off screen rather than display:none, because a
        display:none iframe is not guaranteed to be allowed to make a sound.
      */}
      <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 h-1 w-1">
        <div ref={hostRef} />
      </div>

      {!broken && (
        <div
          className="absolute bottom-4 left-4 z-50 flex items-center gap-2 transition-opacity duration-500 ease-expo"
          style={{
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? "auto" : "none",
          }}
        >
          <button
            type="button"
            onClick={toggle}
            aria-pressed={playing}
            className="group flex items-center gap-2.5 rounded-full border border-line py-2 pr-3.5 pl-3 font-mono text-[10px] tracking-[0.22em] text-faint uppercase transition-all duration-500 ease-expo hover:border-line-strong hover:text-star"
          >
            <span className="sr-only">
              {playing ? "Pause" : "Play"} {RADIO.by} {RADIO.title}
            </span>
            <Bars playing={playing} />
            <span aria-hidden>{RADIO.title}</span>
          </button>

          {/* Whose music it is, and where it actually lives. */}
          <a
            href={RADIO.href}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-line/70 px-2.5 py-2 font-mono text-[10px] tracking-[0.18em] text-faint uppercase transition-colors duration-500 ease-expo hover:border-line-strong hover:text-star"
          >
            {RADIO.by}
          </a>
        </div>
      )}
    </>
  );
}

/** Four bars that move while there is sound and sit flat when there is not. */
function Bars({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden className="flex h-3 items-end gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          data-eq={playing ? "on" : undefined}
          className="w-[2px] rounded-full bg-ember-500 transition-all duration-500 ease-expo"
          style={{
            height: playing ? "100%" : "3px",
            opacity: playing ? 1 : 0.55,
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}
