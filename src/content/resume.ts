/**
 * Single source of truth for every piece of resume content on the site.
 * Editing this file is the only thing needed to keep axli.me in sync with the PDF.
 */

export type Link = {
  label: string;
  href: string;
  /** Shown in the contact card. Set false for anything you'd rather not publish. */
  public: boolean;
  /**
   * What to print, when stripping the scheme off the href does not give
   * something a person would want to read. A tel: href has to be unpunctuated
   * to dial, so the phone sets this.
   */
  display?: string;
};

export type Role = {
  id: string;
  title: string;
  org: string;
  location: string;
  start: string;
  end: string;
  /** Optional sub-headings, used where one role covered distinct products. */
  groups: { name: string | null; bullets: string[] }[];
  /**
   * Path to a still under /public, e.g. "/work/del-coin.jpg". Leaving it out
   * shows an empty frame on purpose: the slot is the layout, and dropping a
   * file in is the only change needed to fill it.
   */
  thumb?: string;
  /** The organisation's own site. Makes the thumbnail a link. */
  href?: string;
  /**
   * Required by the licence, not decoration. The campus photograph is CC BY-SA,
   * which asks for the photographer and the licence wherever the picture
   * appears. The marks are either public domain or used to name their own
   * owner, so they carry no line.
   */
  credit?: string;
};

export type Project = {
  id: string;
  name: string;
  stack: string[];
  start: string;
  end: string;
  bullets: string[];
  /**
   * Path to a still under /public, e.g. "/work/del-coin.jpg". Leaving it out
   * shows an empty frame on purpose: the slot is the layout, and dropping a
   * file in is the only change needed to fill it.
   */
  thumb?: string;
  /** The source. Makes the thumbnail a link. */
  repo?: string;
};

export const identity = {
  name: "Alex Li",
  /**
   * What sits under the name on screen, in pieces so the school can be a mark
   * rather than an abbreviation.
   *
   * Separate from `tagline` on purpose. This one is for someone already looking
   * at the page. The other is for a search result or a browser tab, where a
   * logo is not an option and "CE" matches nothing, so the words are spelled
   * out there instead.
   */
  headline: {
    before: "CE @",
    after: "| SWE Intern @ Del-Coin Holdings Inc.",
  },
  /**
   * Drawn as the wordmark itself, in WaterlooWordmark. The name is kept here
   * for the places that need it as words: the accessible label and metadata.
   */
  school: { name: "University of Waterloo" },
  /** Plain text form, used for <title>, og:title, and the JSON-LD Person. */
  tagline: "Computer Engineering @ University of Waterloo",
  blurb:
    "Computer Engineering student at Waterloo. I build systems end to end: ROS 2 perception stacks, realtime sync with no server in the middle, and AWS infrastructure built from an empty account up.",
  location: "Waterloo, Ontario",
  domain: "axli.me",
  url: "https://axli.me",
};

export const links: Link[] = [
  { label: "LinkedIn", href: "https://linkedin.com/in/alexli8408", public: true },
  { label: "GitHub", href: "https://github.com/alexli8408", public: true },
  { label: "Email", href: "mailto:atli@uwaterloo.ca", public: true },
  // Published at Alex's request. Public pages get scraped by SMS and robocall
  // spammers more than PDFs do, so flip this to false to pull it.
  { label: "Phone", href: "tel:+17783219837", public: true, display: "+1 778 321 9837" },
];

export const education = {
  school: "University of Waterloo",
  location: "Waterloo, Ontario",
  degree: "Bachelor of Applied Science in Computer Engineering",
  start: "Sep. 2025",
  end: "Apr. 2030",
  detail: "GPA: 3.9/4.0",
};

export const roles: Role[] = [
  {
    id: "del-coin",
    thumb: "/work/del-coin.jpg",
    credit: "Engineering 5 by Maria Ly, CC BY-SA 2.0",
    title: "Software Engineering Intern",
    org: "Del-Coin Holdings Inc.",
    location: "Orillia, Ontario",
    start: "May 2026",
    end: "Aug. 2026",
    groups: [
      {
        name: "Membership Platform",
        bullets: [
          "Provisioned AWS from empty account to production as the lead dev: Terraform, ECS Fargate, RDS, ALB, WAFv2",
          "Prevented ID collisions via an atomic UPDATE statement, achieving 0 duplicates in 10 k6 runs at 10,000 users",
          "Fronted Postgres with a 1M-key Bloom filter at 0.097% false positives, cutting ID lookups from 4 ms to 0.35 ms",
        ],
      },
      {
        name: "School Ad Marketplace",
        bullets: [
          "Created a Shopify product per school from its ad price, keeping checkout, PCI, and all amounts with Shopify",
          "Integrated Stripe checkout and an HMAC-authenticated Shopify webhook, idempotent if an order arrives twice",
          "Shipped public school pages with banner, sponsor ad, and per-ad view-count analytics, backed by 1,000+ tests",
        ],
      },
    ],
  },
  {
    id: "watonomous",
    thumb: "/work/watonomous.jpg",
    href: "https://www.watonomous.ca",
    title: "Software Engineer",
    org: "WATonomous",
    location: "Waterloo, Ontario",
    start: "Sep. 2025",
    end: "Present",
    groups: [
      {
        name: null,
        bullets: [
          "Built a 4-node ROS 2 stack driving a Gazebo rover end to end, from LiDAR through costmaps to pure pursuit",
          "Rejected LiDAR returns under 0.15 m as hits on the robot's chassis, keeping phantom obstacles out of the map",
          "Replanned 8-connected A* paths on every map update in 24 ms, staying within 1.10x of straight-line optimal",
        ],
      },
    ],
  },
  {
    id: "warg",
    thumb: "/work/warg.jpg",
    href: "https://www.uwarg.com",
    title: "Software Engineer",
    org: "Waterloo Aerial Robotics Group",
    location: "Waterloo, Ontario",
    start: "Sep. 2025",
    end: "Present",
    groups: [
      {
        name: null,
        bullets: [
          "Built a 4-process MAVLink ground station exchanging heartbeats, reading telemetry, and driving altitude and yaw",
          "Cut 1 Hz heartbeat drift 7x by sending on a fixed schedule, not a full sleep per cycle, holding the ±10 ms window",
          "Cleared a 0.80 IoU gate on red targets by OR-ing two inRange masks across OpenCV's 0–179 hue wrap-around",
        ],
      },
    ],
  },
  {
    id: "tsinghua",
    thumb: "/work/tsinghua.jpg",
    href: "https://www.tsinghua.edu.cn/en/",
    title: "Software Engineering Intern",
    org: "Tsinghua University",
    location: "Beijing, China",
    start: "May 2025",
    end: "Aug. 2025",
    groups: [
      {
        name: null,
        bullets: [
          "Shipped sponsorship and university partnership flows across 10+ FastAPI endpoints, serving 10,000+ users",
          "Migrated image storage to S3 behind CloudFront CDN, cutting pages to 120 KB and 0.78 s TTFB outside China",
          "Fixed 10+ accessibility defects across Safari, Chrome, and mobile, raising the Lighthouse a11y score from 53 to 97",
        ],
      },
    ],
  },
];

export const projects: Project[] = [
  {
    id: "quarry",
    name: "Quarry",
    stack: ["TypeScript", "React", "Three.js", "Postgres"],
    repo: "https://github.com/alexli8408/quarry",
    thumb: "/demo/quarry-card",
    start: "May 2026",
    end: "Aug. 2026",
    bullets: [
      "3D-rendered Postgres databases in VS Code, reading 500+ tables and 7,000+ columns in 7 queries and 64 ms",
      "Labelled primary, foreign and unique keys using Three.js, drawing each foreign key to the column it references",
      "Matched 50+ SQL statements from 10+ languages to live tables in 27 ms, auto-translating each driver's syntax",
    ],
  },
  {
    id: "limn",
    name: "Limn",
    stack: ["TypeScript", "Next.js", "Supabase", "Postgres", "Python", "FastAPI", "OpenCV", "Gemini"],
    repo: "https://github.com/alexli8408/limn",
    thumb: "/demo/limn-card",
    start: "Jan. 2026",
    end: "Apr. 2026",
    bullets: [
      "Broadcast 8,000+ updates to 10+ clients at a 40 ms round trip over Supabase Realtime, with no sync server",
      "Snapped freehand strokes to clean shapes client-side in 0.07 ms, which were 95.8% accurate over 600+ strokes",
      "Extracted all drawn shapes from whiteboard photos in 57 ms via OpenCV deskew, thinning, and polyline fitting",
    ],
  },
  {
    id: "truelight",
    repo: "https://github.com/alexli8408/TrueLight",
    name: "TrueLight",
    stack: ["React Native", "Expo", "Next.js", "FastAPI", "YOLOv3", "OpenCV"],
    thumb: "/demo/truelight-card",
    start: "Sep. 2025",
    end: "Dec. 2025",
    bullets: [
      "Alerted colorblind users based on their color-vision deficiency type, mapping 31 HSV ranges to 8 types of CVD",
      "Ranked by bounding-box area over frame area in low-vision mode, and by threshold tuned for walking or driving",
      "Profiled the detection pipeline to 74 ms/frame, finding JPEG decode at 69% and model inference at only 21%",
    ],
  },
];

export const skills: { group: string; items: string[] }[] = [
  {
    group: "Languages",
    items: [
      "Python",
      "C/C++",
      "SQL (Postgres, MySQL)",
      "JavaScript/TypeScript",
      "HTML/CSS",
    ],
  },
  {
    group: "Frameworks",
    items: [
      "Next.js",
      "React",
      "React Native",
      "Expo",
      "Node.js",
      "Tailwind",
      "FastAPI",
      "Flask",
      "ROS 2",
      "Three.js",
    ],
  },
  {
    group: "Developer Tools",
    items: [
      "Git",
      "Docker",
      "Linux",
      "AWS (S3, Lambda, ECS, RDS, VPC)",
      "Terraform",
      "pytest",
      "k6",
      "Gazebo",
      "MAVLink",
      "Supabase",
      "Vitest",
      "Gemini",
    ],
  },
  {
    group: "Libraries",
    items: [
      "SQLAlchemy",
      "SQLModel",
      "Pydantic",
      "Alembic",
      "NumPy",
      "OpenCV",
      "YOLOv3",
      "Stripe",
      "Shopify",
    ],
  },
];
