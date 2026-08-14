import { projects } from "@/content/resume";

export function Projects() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {projects.map((project) => (
        <article
          key={project.id}
          className="group h-full rounded-xl border border-line bg-sky-950/60 p-5 transition-colors duration-500 ease-soft hover:border-line-strong"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-base font-semibold tracking-tight text-star">{project.name}</h3>
            <span className="font-mono text-[11px] whitespace-nowrap text-faint">
              {project.start} – {project.end}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {project.bullets.map((bullet) => (
              <li
                key={bullet}
                className="relative pl-4 text-sm leading-relaxed text-muted before:absolute before:top-[0.6em] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-sky-600"
              >
                {bullet}
              </li>
            ))}
          </ul>
          <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-line pt-4">
            {project.stack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-faint transition-colors duration-500 ease-soft group-hover:text-muted"
              >
                {tech}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
