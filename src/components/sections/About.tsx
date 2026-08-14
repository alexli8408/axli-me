import { education } from "@/content/resume";

/** A short introduction and where he studies. */
export function About() {
  return (
    <div className="space-y-6">
      <p className="text-[15px] leading-relaxed text-muted">
        Hi! I&apos;m Alex, a second year computer engineering student at the University of
        Waterloo. I was born and raised in Vancouver and I&apos;m interested in robotics
        and full stack development. Outside of academics, I enjoy playing video games,
        producing music, and doing combat sports.
      </p>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-5">
        <div>
          <p className="text-sm font-medium text-star">{education.school}</p>
          <p className="mt-0.5 text-xs text-muted">{education.degree}</p>
        </div>
        <p className="font-mono text-[11px] whitespace-nowrap text-faint">
          {education.start} – {education.end} · {education.detail}
        </p>
      </div>
    </div>
  );
}
