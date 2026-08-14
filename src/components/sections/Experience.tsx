import { roles } from "@/content/resume";
import { Thumb } from "./Thumb";

/**
 * Role, company, dates, picture. Nothing else.
 *
 * The bullets that used to be here are the resume's job, and a wall of them
 * behind a shutter animation is a wall of them nobody reads. What this needs to
 * do is say where he has been, quickly.
 */
export function Experience() {
  return (
    <ol className="space-y-9">
      {roles.map((role) => (
        <li key={role.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-0.5">
            <h3 className="text-[15px] font-semibold tracking-tight text-star">{role.title}</h3>
            <span className="font-mono text-[11px] whitespace-nowrap text-faint">
              {role.start} – {role.end}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ember-400">{role.org}</p>
          <Thumb src={role.thumb} alt={role.org} href={role.href} credit={role.credit} />
        </li>
      ))}
    </ol>
  );
}
