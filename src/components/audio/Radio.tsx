"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hash01 } from "@/lib/hash";

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
/** Long enough that it arrives rather than starts. */
const FADE_MS = 6000;
/** Short, but not a cut. A cut is what makes the click. */
const FADE_OUT_MS = 420;
/** The most a single frame may advance a fade, however long it actually was. */
const FRAME_CAP_MS = 100;

/**
 * The onset: how long to spend crossing the four quietest steps, and where it
 * hands over to the long fade.
 *
 * The player takes a whole number from 0 to 100, so a fade to 32 has 32 steps
 * and no more, and the bottom few are the coarsest thing it can do: 1 to 2 is
 * six decibels, 2 to 3 is three and a half. Nothing can make those small. What
 * can be done is get through them fast enough that they blur into an onset
 * rather than being laid out slowly enough to count individually, which is what
 * both of the earlier curves did and why the front of the fade kept sounding
 * like a step no matter how the easing was shaped.
 */
const ONSET_MS = 150;
const ONSET_LEVEL = 4;

/**
 * The volume to ask for, as a whole number, this far into a fade.
 *
 * Two parts. Straight up through the coarse steps, then evenly spaced in
 * decibels the rest of the way, which is what a fade actually sounds like: an
 * even spacing in amplitude would put nearly every audible change in the first
 * moment, since 1 to 2 and 16 to 32 are both six decibels.
 */
function rampLevel(ms: number): number {
  if (ms <= 0) return 1;
  if (ms < ONSET_MS) {
    return Math.max(1, Math.round(1 + (ONSET_LEVEL - 1) * (ms / ONSET_MS)));
  }
  const u = Math.min(1, (ms - ONSET_MS) / (FADE_MS - ONSET_MS));
  const floorDb = 20 * Math.log10(ONSET_LEVEL / VOLUME);
  return Math.round(VOLUME * Math.pow(10, (floorDb * (1 - u)) / 20));
}
const STORAGE_KEY = "axli:music";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

type YTOptions = {
  videoId: string;
  host?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (e: { target: YTPlayer }) => void;
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
  /**
   * The wrapper, which survives. The API replaces the host div with its iframe,
   * so anything written to that one after the player is built goes onto a node
   * that is no longer in the document.
   */
  const wrapRef = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const fade = useRef(0);
  const armed = useRef(false);
  /** What the volume actually is, so a fade can start from where it stands. */
  const level = useRef(0);
  /** Set when a fade is owed, cleared once sound has actually started. */
  const owed = useRef(true);

  const [playing, setPlaying] = useState(false);
  const [broken, setBroken] = useState(false);

  /**
   * Come up from silence, and get there slowly.
   *
   * Eased rather than linear. Loudness is not linear in the number you hand a
   * volume control, so a straight ramp is most of the way to full before it
   * feels like it has started. Squaring it keeps the first second genuinely
   * faint, which is the difference between music arriving and music starting.
   */
  const fadeIn = useCallback(() => {
    const p = player.current;
    if (!p) return;
    cancelAnimationFrame(fade.current);

    // Whole numbers only, and only when the number changes. Every call is a
    // message across an iframe boundary, and sixty a second for three seconds
    // is a couple of hundred of them to say the same thing over and over.
    let sent = -1;
    const set = (v: number) => {
      level.current = v;
      if (v === sent) return;
      sent = v;
      p.setVolume(v);
      // Mirrored onto the host element so the ramp can be watched from
      // outside. The player's own volume is behind a cross-origin iframe and
      // there is otherwise no way to tell a working fade from a broken one.
      if (wrapRef.current) {
        wrapRef.current.dataset.volume = String(v);
        // What the player says it is actually doing. Asking for a volume and
        // getting it are different things across an iframe boundary.
        wrapRef.current.dataset.actual = String(Math.round(p.getVolume?.() ?? -1));
        wrapRef.current.dataset.muted = String(p.isMuted?.() ?? "?");
      }
    };

    // Silent, then unmuted, then the ramp. In that order: the player reports
    // itself sitting at volume 5 and unmuted while it buffers, whatever it was
    // told at ready, so the mute is the only thing that reliably holds it quiet
    // until there is a ramp to hand it over to.
    p.setVolume(0);
    p.unMute();
    // Immediately, in this same task, not on the next frame. unMute restores
    // whatever level the player was holding before it was muted, which it
    // reports as 5, so anything that waits a frame to correct it is a frame of
    // that level. Queued back to back the two messages arrive back to back.
    set(rampLevel(0));

    // Elapsed is accumulated from frame to frame and each step is capped,
    // rather than read off the wall clock.
    //
    // Frames stop arriving when the tab goes to the background, so a fade timed
    // against the clock froze at whatever level it had reached and then leapt
    // to full the moment you came back: the gap counted as fade that had
    // already happened. Capping each step means a hidden tab advances the fade
    // by almost nothing, so it holds where it was and carries on from there.
    let elapsed = 0;
    let last = performance.now();
    const step = (now: number) => {
      elapsed += Math.min(FRAME_CAP_MS, now - last);
      last = now;
      set(rampLevel(elapsed));
      if (elapsed < FADE_MS) fade.current = requestAnimationFrame(step);
    };
    fade.current = requestAnimationFrame(step);
  }, []);

  /**
   * Down to nothing, then stop.
   *
   * Pausing outright cut the waveform off wherever it happened to be, and a
   * waveform that stops at a non-zero sample is a step, which is a click. Short
   * enough to still feel like pressing stop.
   */
  const fadeOutThenPause = useCallback(() => {
    const p = player.current;
    if (!p) return;
    cancelAnimationFrame(fade.current);

    const from = Math.max(1, level.current);
    let elapsed = 0;
    let last = performance.now();
    let sent = -1;
    const step = (now: number) => {
      elapsed += Math.min(FRAME_CAP_MS, now - last);
      last = now;
      const u = Math.min(1, elapsed / FADE_OUT_MS);
      // Down a decibel scale, so it thins out rather than dropping through the
      // loud half in the first fifty milliseconds.
      const v = u >= 1 ? 0 : Math.max(0, Math.round(from * Math.pow(10, (-24 * u) / 20)));
      level.current = v;
      if (v !== sent) {
        sent = v;
        p.setVolume(v);
        if (wrapRef.current) wrapRef.current.dataset.volume = String(v);
      }
      if (u < 1) {
        fade.current = requestAnimationFrame(step);
      } else {
        p.setVolume(0);
        p.pauseVideo();
      }
    };
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
        // Both deliberate. Autoplay would let YouTube start the stream the
        // instant the player is ready, which can beat the setVolume(0) below
        // and put out a burst at whatever the default level is: exactly the
        // thing this is supposed to avoid. Starting muted and silent, then
        // unmuting once the volume is known to be zero, makes that impossible.
        autoplay: 0,
        mute: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        // The player comes from the event, not from the ref.
        //
        // onReady can fire before `new YT.Player(...)` has returned, so the ref
        // is still null when this runs and every call through it hit the null
        // guard and did nothing. That was true of the old code too. It was
        // invisible only because autoplay was on, so the stream played whether
        // or not any of this worked, and the volume ramp never ran at all.
        onReady: (e) => {
          player.current = e.target;
          level.current = 0;
          // Stays muted through buffering. The volume alone does not hold: the
          // player reports itself at 5 and unmuted here regardless, and audio
          // that starts before the ramp does is the jump at the front of it.
          e.target.setVolume(0);
          e.target.mute();
          e.target.playVideo();
        },
        onStateChange: (e) => {
          // 1 is playing, 3 is buffering. Anything else is not making a sound.
          setPlaying(e.data === 1 || e.data === 3);
          if (wrapRef.current) {
            const p = player.current;
            wrapRef.current.dataset.state = String(e.data);
            wrapRef.current.dataset.atState = `${p?.getVolume?.() ?? -1}/${p?.isMuted?.() ?? "?"}`;
          }

          // The fade starts here rather than at onReady, because ready only
          // means the player will accept commands. A livestream then spends a
          // few seconds buffering, and a ramp started before any of that is
          // over long before there is anything to hear, which is a fade that
          // does nothing. This is the first frame with actual sound in it.
          if (e.data === 1 && owed.current) {
            owed.current = false;
            fadeIn();
          }
        },
        onError: () => setBroken(true),
      },
    });
  }, [fadeIn]);

  /**
   * Start on the way in.
   *
   * Nothing exists until the shutter is pressed. No player, no iframe, no
   * request to anyone, and so no possibility of a sound on arrival. Browsers
   * refuse to play audio until a page has been interacted with anyway, and the
   * shutter button is that interaction; once a document has been clicked the
   * permission sticks, so this can wait for the API to come over the network
   * rather than having to run inside the handler.
   */
  useEffect(() => {
    if (!start || armed.current) return;
    armed.current = true;
    if (window.localStorage?.getItem(STORAGE_KEY) === "off") return;

    // Held off the commit rather than fired from it, so building an iframe and
    // parsing a third party script is not competing with the zoom for the same
    // frames.
    //
    // Cutting this to 180ms was tried and reverted. It does not move the time
    // to first sound at all, which is around five seconds either way and is
    // spent on the script arriving, the player coming up and a livestream
    // buffering, none of which is ours. It does put the script parse inside the
    // zoom. So this buys smoother frames for nothing.
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
      fadeOutThenPause();
      window.localStorage?.setItem(STORAGE_KEY, "off");
    } else {
      // Silent before it is told to play, not after.
      //
      // Resuming used to call playVideo() while the volume was still wherever
      // the last fade had left it, so it came back at full level for the
      // fraction of a second it took the playing event to arrive and reset it
      // to zero. That was the blast, then the silence, then the fade: three
      // things where there should have been one.
      cancelAnimationFrame(fade.current);
      level.current = 0;
      player.current.setVolume(0);
      player.current.mute();
      owed.current = true;
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
      <div
        ref={wrapRef}
        aria-hidden
        className="pointer-events-none fixed top-0 -left-[9999px] h-1 w-1"
      >
        <div ref={hostRef} />
      </div>

      {!broken && (
        <div
          className="absolute bottom-4 left-4 z-50 transition-opacity duration-700 ease-expo"
          style={{
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? "auto" : "none",
          }}
        >
          <div className="relative">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={playing}
              className="radio-card flex w-[15.5rem] flex-col gap-2 rounded-2xl border border-line px-4 pt-3 pb-3 text-left transition-colors duration-500 ease-expo hover:border-line-strong"
            >
              <span className="sr-only">
                {playing ? "Pause" : "Play"} {RADIO.by} {RADIO.title}
              </span>
              <span aria-hidden className="block">
                <span className="block font-mono text-[12px] leading-none font-medium tracking-[0.26em] text-star uppercase">
                  {RADIO.title}
                </span>
                <span className="mt-1.5 block font-mono text-[10px] leading-none tracking-[0.24em] text-faint uppercase">
                  {RADIO.by}
                </span>
              </span>
              <Spectrum playing={playing} />
            </button>

            {/* Sibling, not a child: a link inside a button is not valid, and
                the two do different things. */}
            <a
              href={RADIO.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Open ${RADIO.title} by ${RADIO.by} on YouTube`}
              className="radio-badge absolute -right-2 -bottom-2 grid h-9 w-9 place-items-center rounded-full border border-line text-faint transition-colors duration-500 ease-expo hover:border-ember-500/60 hover:text-ember-400"
            >
              <svg width="15" height="11" viewBox="0 0 24 17" fill="none" aria-hidden>
                <path
                  d="M23.5 2.6A3 3 0 0 0 21.4.5C19.5 0 12 0 12 0S4.5 0 2.6.5A3 3 0 0 0 .5 2.6C0 4.5 0 8.5 0 8.5s0 4 .5 5.9a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.9.5-5.9s0-4-.5-5.9Z"
                  fill="currentColor"
                  opacity="0.55"
                />
                <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6Z" fill="var(--color-sky-950)" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The level meter.
 *
 * Not a real analyser, and it cannot be one: the audio is playing inside a
 * cross-origin iframe, so an AudioContext has nothing to tap. These are bars
 * with their own periods, close enough in feel and honest about being decor.
 * Each one gets a fixed duration and a negative delay derived from its index,
 * so they beat against each other rather than pumping in unison.
 *
 * The numbers come from an integer hash and are rounded before they reach a
 * style. Math.sin was the obvious way to get them and it caused a hydration
 * mismatch: its precision is not pinned by the spec, so Node and the browser
 * can disagree in the last bits, which is enough to turn 43.7719% into
 * 43.7718% and make React throw the tree away.
 */
const BAR_COUNT = 34;

function Spectrum({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden className="flex h-4 items-end gap-[2px]">
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const r = hash01(i);
        return (
          <span
            key={i}
            data-eq={playing ? "on" : undefined}
            className="w-[3px] flex-1 rounded-full bg-cygnus-500/70 transition-all duration-700 ease-expo"
            style={{
              height: playing ? `${(28 + r * 72).toFixed(2)}%` : "10%",
              opacity: playing ? +(0.5 + r * 0.5).toFixed(3) : 0.35,
              animationDuration: `${(0.55 + r * 0.85).toFixed(3)}s`,
              animationDelay: `-${(r * 1.4).toFixed(2)}s`,
            }}
          />
        );
      })}
    </span>
  );
}
