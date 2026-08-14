import { skills } from "@/content/resume";

export function Skills() {
  return (
    <div className="space-y-6">
      {skills.map((group) => (
        <div key={group.group} className="grid gap-3 sm:grid-cols-[9rem_1fr] sm:gap-6">
          <h3 className="pt-1 font-mono text-[11px] tracking-[0.2em] text-cygnus-400 uppercase">
            {group.group}
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <li
                key={item}
                className="rounded-md border border-line bg-sky-950/60 px-2.5 py-1 text-xs text-muted transition-colors duration-500 ease-soft hover:border-line-strong hover:text-star"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
