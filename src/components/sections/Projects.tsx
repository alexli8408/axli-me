import { projects } from "@/content/resume";
import { Thumb } from "./Thumb";

/** Name, what it is, dates, what it was built with, picture. */
export function Projects() {
  return (
    <ol className="space-y-9">
      {projects.map((project) => (
        <li key={project.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-0.5">
            <h3 className="text-[15px] font-semibold tracking-tight text-star">{project.name}</h3>
            <span className="font-mono text-[11px] whitespace-nowrap text-faint">
              {project.start} – {project.end}
            </span>
          </div>
          {/* Above the stack, because what a thing does is worth more than what
              it is made of, and a reader who stops after one line should get
              the more useful one. */}
          {project.what ? (
            <p className="mt-0.5 text-sm text-ember-400">{project.what}</p>
          ) : null}
          <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-faint">
            {project.stack.join(" · ")}
          </p>
          <Thumb
            src={project.thumb}
            alt={project.name}
            href={project.repo}
            badge={project.repo ? "View source" : undefined}
          />
        </li>
      ))}
    </ol>
  );
}
