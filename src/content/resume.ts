/**
 * Single source of truth for every piece of resume content on the site.
 * Editing this file is the only thing needed to keep axli.me in sync with the PDF.
 */

export type Link = {
  label: string;
  href: string;
  /** Shown in the contact card. Set false for anything you'd rather not publish. */
  public: boolean;
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
};

export type Project = {
  id: string;
  name: string;
  stack: string[];
  start: string;
  end: string;
  bullets: string[];
  /**
   * Marks the slot Alex is holding for the next project. The resume repeats
   * TrueLight here on purpose. Swap the fields below when the new project is
   * ready and nothing else needs to change.
   */
  placeholder?: boolean;
};

export const identity = {
  name: "Alex Li",
  /** Rendered alongside the latin name in the title lockup. */
  nameZh: "李天翼",
  /** Plain text form, used for <title>, og:title, and the JSON-LD Person. */
  tagline: "Computer Engineering @ University of Waterloo",
  /** On screen the university is the wordmark, so the text stops at the "@". */
  taglinePrefix: "Computer Engineering @",
  blurb:
    "Computer Engineering student at Waterloo. I work on low-level systems: hand-written INT8 kernels, ROS 2 perception stacks, and AWS infrastructure built from an empty account up.",
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
  { label: "Phone", href: "tel:+17783219837", public: true },
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
    title: "Software Engineering Intern",
    org: "Tsinghua University",
    location: "Beijing, China",
    start: "May 2025",
    end: "Aug. 2025",
    groups: [
      {
        name: null,
        bullets: [
          "Shipped sponsorship and university partnership flows across 10+ FastAPI endpoints, serving 1,000+ users",
          "Migrated image storage to S3 behind CloudFront CDN, cutting pages to 120 KB and 0.78 s TTFB outside China",
          "Fixed 10+ accessibility defects across Safari, Chrome, and mobile, raising the Lighthouse a11y score from 53 to 97",
        ],
      },
    ],
  },
];

export const projects: Project[] = [
  {
    id: "int8-squeezenet",
    name: "INT8 SqueezeNet Inference Engine",
    stack: ["C++17", "ARM NEON", "ONNX Runtime", "Python"],
    start: "May 2026",
    end: "Aug. 2026",
    bullets: [
      "Hand-wrote an INT8 SqueezeNet forward pass in C++17/NEON: 3.10 ms, 50% of M2 SDOT peak",
      "Matched ONNX Runtime per-node tensors to 1 LSB across all 26 conv layers, 25 bit-identical",
      "Showed per-node diffs catch every fault accuracy testing does at up to 20x fewer images, plus one it never will",
    ],
  },
  {
    id: "truelight",
    name: "TrueLight",
    stack: ["React Native", "Expo", "Next.js", "FastAPI", "YOLOv3", "OpenCV"],
    start: "Jan. 2026",
    end: "Apr. 2026",
    bullets: [
      "Built a real-time assistive vision app alerting colorblind users to objects they cannot distinguish",
      "Architected 3 services: a React Native client, Next.js gateway, and YOLOv3 detection server",
      "Profiled the detection pipeline to 74 ms/frame, finding JPEG decode at 69% and model inference at only 21%",
    ],
  },
  {
    // Placeholder slot, left exactly as it appears on the resume.
    id: "truelight-placeholder",
    name: "TrueLight",
    stack: ["React Native", "Expo", "Next.js", "FastAPI", "YOLOv3", "OpenCV"],
    start: "Jan. 2026",
    end: "Apr. 2026",
    bullets: [
      "Built a real-time assistive vision app alerting colorblind users to objects they cannot distinguish",
      "Architected 3 services: a React Native client, Next.js gateway, and YOLOv3 detection server",
      "Profiled the detection pipeline to 74 ms/frame, finding JPEG decode at 69% and model inference at only 21%",
    ],
    placeholder: true,
  },
];

export const skills: { group: string; items: string[] }[] = [
  {
    group: "Languages",
    items: [
      "Python",
      "C/C++ (C++17, ARM NEON)",
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
      "ONNX Runtime",
      "OpenCV",
      "YOLOv3",
      "Stripe",
      "Shopify",
    ],
  },
];
