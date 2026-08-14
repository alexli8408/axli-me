import { education } from "@/content/resume";

export function About() {
  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        <p>
          I like working close to the metal. Most of what I build ends up being kernels,
          robot perception, or infrastructure, and the part I care about is proving it
          actually works.
        </p>
        <p>
          Right now I&apos;m between co-op terms. I was the lead developer on a membership
          platform at <span className="text-star">Del-Coin Holdings</span>, and before that I
          worked on assistive vision tooling, autonomy software at{" "}
          <span className="text-star">WATonomous</span>, and a MAVLink ground station for{" "}
          <span className="text-star">Waterloo Aerial Robotics</span>.
        </p>
        <p>
          The problems I enjoy most are the ones with a right answer you can check against.
          Matching every tensor in a network to a single least-significant bit is more
          satisfying to me than any benchmark number.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-sky-950/60 p-5">
        <h3 className="font-mono text-[11px] tracking-[0.22em] text-faint uppercase">Education</h3>
        <p className="mt-4 text-base font-medium text-star">{education.school}</p>
        <p className="mt-1 text-xs text-muted">{education.degree}</p>
        <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-faint">Term</dt>
            <dd className="text-right text-muted">{education.start} – {education.end}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">Standing</dt>
            <dd className="text-right text-muted">{education.detail}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">Based in</dt>
            <dd className="text-right text-muted">{education.location}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
