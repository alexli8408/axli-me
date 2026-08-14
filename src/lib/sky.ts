import { links, projects, roles, skills } from "@/content/resume";

/**
 * The star map.
 *
 * Each constellation is a section of the site, and its individual stars are the
 * real items inside that section: one star per role, per project, per skill
 * group. That is the whole reason this metaphor is worth using. A blob or a card
 * can only stand for a category, but a constellation has interior structure, so
 * the shape itself carries how many things there are and how they relate.
 *
 * Positions are normalised to the viewport, (0,0) top left and (1,1) bottom
 * right. They are hand placed rather than generated: real constellations are
 * irregular, and anything evenly spaced reads as a UI grid with stars drawn on
 * top of it.
 */

export type Star = {
  /** Normalised position. */
  x: number;
  y: number;
  /** Apparent brightness, 0 to 1. Drives radius and glow. */
  mag: number;
  /** The thing this star actually is. Shown on hover. */
  label: string;
};

export type Constellation = {
  id: string;
  /** Section name, drawn beside the shape. */
  label: string;
  kicker: string;
  /** Heading on the overlay card. */
  title: string;
  /** Sub heading on the overlay card. */
  /** Optional line under the card title. Omitted, the title stands alone. */
  intro?: string;
  href: string;
  stars: Star[];
  /** Index pairs joined by a line. */
  lines: [number, number][];
};

export const constellations: Constellation[] = [
  {
    id: "about",
    label: "About Me",
    kicker: "01",
    title: "Alex Li",
    href: "#about",
    stars: [
      { x: 0.145, y: 0.235, mag: 0.85, label: "Waterloo" },
      { x: 0.205, y: 0.285, mag: 1.0, label: "Alex Li" },
      { x: 0.175, y: 0.352, mag: 0.7, label: "Computer Engineering" },
    ],
    lines: [
      [0, 1],
      [1, 2],
    ],
  },
  {
    id: "experience",
    // The largest shape, because it is the part of the resume that matters most.
    label: "Experience",
    kicker: "02",
    title: "Where I've worked",
    href: "#experience",
    stars: [
      { x: 0.395, y: 0.395, mag: 1.0, label: roles[0].org },
      { x: 0.472, y: 0.348, mag: 0.86, label: roles[1].org },
      { x: 0.535, y: 0.432, mag: 0.86, label: roles[2].org },
      { x: 0.447, y: 0.492, mag: 0.8, label: roles[3].org },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  },
  {
    id: "projects",
    label: "Projects",
    kicker: "03",
    title: "Things I've built",
    href: "#projects",
    stars: [
      { x: 0.735, y: 0.245, mag: 1.0, label: projects[0].name },
      { x: 0.805, y: 0.302, mag: 0.82, label: projects[1].name },
      { x: 0.762, y: 0.372, mag: 0.62, label: "Next" },
    ],
    lines: [
      [0, 1],
      [1, 2],
    ],
  },
  {
    id: "skills",
    label: "Skills",
    kicker: "04",
    title: "Toolkit",
    href: "#skills",
    stars: [
      { x: 0.215, y: 0.655, mag: 0.9, label: skills[0].group },
      { x: 0.288, y: 0.678, mag: 0.78, label: skills[1].group },
      { x: 0.332, y: 0.742, mag: 0.7, label: skills[2].group },
      { x: 0.252, y: 0.775, mag: 0.7, label: skills[3].group },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  {
    id: "contact",
    label: "Contact",
    kicker: "05",
    title: "Get in touch (open to coops)",
    href: "#contact",
    stars: [
      { x: 0.688, y: 0.688, mag: 0.82, label: links[0].label },
      { x: 0.762, y: 0.722, mag: 0.9, label: links[1].label },
      { x: 0.715, y: 0.788, mag: 0.74, label: links[2].label },
    ],
    lines: [
      [0, 1],
      [1, 2],
    ],
  },
];

/** Centre of a constellation, used to place its name and its hit target. */
export function centroid(c: Constellation): { x: number; y: number } {
  const n = c.stars.length;
  return {
    x: c.stars.reduce((a, s) => a + s.x, 0) / n,
    y: c.stars.reduce((a, s) => a + s.y, 0) / n,
  };
}

/**
 * Where the constellation's name sits: below the lowest star, not at the
 * centroid. At the centroid it lands on top of the star labels that appear on
 * hover, and the two collide.
 */
export function labelAnchor(c: Constellation): { x: number; y: number } {
  return {
    x: centroid(c).x,
    y: Math.max(...c.stars.map((s) => s.y)) + 0.075,
  };
}

/** Bounding radius in normalised units, for the hover halo. */
export function spread(c: Constellation): number {
  const mid = centroid(c);
  return Math.max(
    ...c.stars.map((s) => Math.hypot(s.x - mid.x, s.y - mid.y)),
  );
}
