/**
 * The shutter, as a sound.
 *
 * Synthesised rather than a file: it is about a tenth of a second of noise and
 * two sine blips, so shipping an audio asset for it would cost more than the
 * code, and there is no licence to think about.
 *
 * An SLR firing is three things in quick succession. The mirror swings up and
 * hits its stop, which is the loud part and the low part. The shutter runs.
 * Then the mirror drops back, a little quieter and a little duller. Bunching
 * them into one burst gives a toy camera; spacing them gives a real one.
 *
 * The temptation is to make each hit longer, and it must be resisted. Noise
 * plus a decaying envelope is a snare drum, and the only thing separating this
 * from one is that nothing here rings for more than about forty milliseconds.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // Autoplay policy suspends a context created before a gesture. The visitor
  // has pressed a button by the time this runs, so it is allowed to resume.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A second of white noise, made once and re-read for every hit. */
function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/**
 * One mechanical hit: a wide band of noise under a very fast decay.
 *
 * Band limited between two corners rather than picked out by a narrow bandpass.
 * A narrow filter leaves a pitched ping, which is a toy; the rasp of a real
 * mechanism is broadband, and the width between the corners is what makes it
 * sound like metal scraping rather than a tone.
 */
function hit(
  ac: AudioContext,
  at: number,
  lowHz: number,
  highHz: number,
  decay: number,
  gain: number,
) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;

  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = lowHz;
  hp.Q.value = 0.7;

  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = highHz;
  lp.Q.value = 0.7;

  const amp = ac.createGain();
  amp.gain.setValueAtTime(0, at);
  // A near instant attack. Anything slower rounds the front off the hit and it
  // stops sounding struck.
  amp.gain.linearRampToValueAtTime(gain, at + 0.0008);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + decay);

  src.connect(hp).connect(lp).connect(amp).connect(ac.destination);
  src.start(at, Math.random() * 0.5);
  src.stop(at + decay + 0.02);
}

/** The body of the camera taking the knock, which is what gives it weight. */
function thud(ac: AudioContext, at: number, freq: number, decay: number, gain: number) {
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.55, at + decay);

  const amp = ac.createGain();
  amp.gain.setValueAtTime(0, at);
  amp.gain.linearRampToValueAtTime(gain, at + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + decay);

  osc.connect(amp).connect(ac.destination);
  osc.start(at);
  osc.stop(at + decay + 0.02);
}

/**
 * Fire it. Safe to call before anything is ready: it does nothing rather than
 * throwing if the browser has no Web Audio or the context will not start.
 */
export function playShutter(volume = 0.85) {
  const ac = context();
  if (!ac) return;

  const t = ac.currentTime + 0.005;
  const v = Math.max(0, Math.min(1, volume));

  // Mirror up: the loudest of the three, and the one with the body under it.
  hit(ac, t, 420, 9000, 0.05, 0.9 * v);
  thud(ac, t, 190, 0.075, 0.5 * v);

  // The shutter itself. Bright and wide open at the top, which is the scrape.
  hit(ac, t + 0.03, 2200, 15000, 0.028, 0.72 * v);

  // Mirror down: the same knock again, softer, and duller for having less top.
  hit(ac, t + 0.095, 320, 5200, 0.055, 0.5 * v);
  thud(ac, t + 0.095, 150, 0.065, 0.26 * v);
}

/**
 * Build the context ahead of time, inside a real gesture.
 *
 * Creating it at the moment of the shutter would work, but a context spun up
 * cold has to allocate and resume, and that can land a few milliseconds after
 * the flash it is supposed to be simultaneous with.
 */
export function warmShutter() {
  context();
}
