import type { Metadata, Viewport } from "next";
// Vercel's `geist` package ships the font files in node_modules and wires them
// through next/font/local. next/font/google refetches from Google at every
// build, which fails whenever that host is unreachable and adds a third-party
// request to the critical path for no benefit.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { identity, education, links } from "@/content/resume";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(identity.url),
  title: { default: `${identity.name} — ${identity.tagline}`, template: `%s — ${identity.name}` },
  description: identity.blurb,
  keywords: [
    "Alex Li",
    "software engineer",
    "computer engineering",
    "University of Waterloo",
    "co-op",
    "C++",
    "ARM NEON",
    "ROS 2",
    "Next.js",
  ],
  authors: [{ name: identity.name, url: identity.url }],
  creator: identity.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: identity.url,
    siteName: identity.name,
    title: `${identity.name} — ${identity.tagline}`,
    description: identity.blurb,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: `${identity.name} — ${identity.tagline}`,
    description: identity.blurb,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export const viewport: Viewport = { themeColor: "#04070f", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Read by search engines straight out of the HTML, no JS execution needed.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: identity.name,
    url: identity.url,
    jobTitle: "Software Engineer",
    description: identity.blurb,
    email: links.find((l) => l.label === "Email")?.href.replace("mailto:", ""),
    alumniOf: { "@type": "CollegeOrUniversity", name: education.school },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Waterloo",
      addressRegion: "ON",
      addressCountry: "CA",
    },
    sameAs: links.filter((l) => l.public && l.href.startsWith("http")).map((l) => l.href),
  };

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script
          type="application/ld+json"
          // Static, author-controlled object. No user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
