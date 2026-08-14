/**
 * A number between 0 and 1, from integers, identically everywhere.
 *
 * Anything that varies per element and is computed during render has to agree
 * between the server and the browser or React tears the tree down and rebuilds
 * it. Math.random obviously cannot do that, but neither can Math.sin: the spec
 * does not pin its precision, so two engines are free to differ in the last
 * bits, and that is enough to change "43.7719%" into "43.7718%" and trip a
 * hydration mismatch on an inline style.
 *
 * This is integer arithmetic all the way down. Math.imul and the shifts are
 * exact by definition, so the result is the same on both sides of the wire.
 */
export function hash01(...parts: number[]): number {
  let x = 0x811c9dc5;
  for (const part of parts) {
    x = Math.imul(x ^ (part | 0), 0x01000193) >>> 0;
    x ^= x >>> 15;
  }
  x = Math.imul(x ^ (x >>> 16), 0x2545f491) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0x27d4eb2d) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Same, for coordinates that arrive as fractions. Quantised, then hashed. */
export function hashAt(x: number, y: number, salt = 0): number {
  return hash01(Math.round(x * 100000), Math.round(y * 100000), salt);
}
