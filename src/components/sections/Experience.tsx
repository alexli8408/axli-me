import { roles } from "@/content/resume";

export function Experience() {
  return (
    <ol className="space-y-10 border-l border-line pl-6">
      {roles.map((role) => (
        <li key={role.id} className="relative">
          <span
            aria-hidden
            className="absolute top-1.5 -left-6 h-2 w-2 -translate-x-1/2 rounded-full bg-ember-500 ring-4 ring-sky-900"
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
            <h3 className="text-base font-semibold tracking-tight text-star">{role.title}</h3>
            <span className="font-mono text-[11px] whitespace-nowrap text-faint">
              {role.start} – {role.end}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
            <p className="text-sm text-ember-400 italic">{role.org}</p>
            <span className="text-[11px] text-faint">{role.location}</span>
          </div>
          <div className="mt-4 space-y-4">
            {role.groups.map((group, gi) => (
              <div key={group.name ?? gi}>
                {group.name ? (
                  <h4 className="mb-2 font-mono text-[10px] tracking-[0.18em] text-cygnus-400 uppercase">
                    {group.name}
                  </h4>
                ) : null}
                <ul className="space-y-2">
                  {group.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="relative pl-4 text-sm leading-relaxed text-muted before:absolute before:top-[0.6em] before:left-0 before:h-1 before:w-1 before:rounded-full before:bg-sky-600"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
