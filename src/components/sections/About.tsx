import { education } from "@/content/resume";

/** Two sentences and where he studies. Anything longer is a cover letter. */
export function About() {
  return (
    <div className="space-y-6">
      <p className="text-[15px] leading-relaxed text-muted">
        I work close to the metal: kernels, robot perception, infrastructure. The part I
        care about is proving the thing actually works, which is why I would rather match
        every tensor in a network to a single bit than quote a benchmark.
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
