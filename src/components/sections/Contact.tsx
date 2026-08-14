import { identity, links } from "@/content/resume";

export function Contact() {
  const visible = links.filter((link) => link.public);

  return (
    <div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {visible.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer noopener" : undefined}
              className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-sky-950/60 px-4 py-3.5 transition-all duration-500 ease-soft hover:-translate-y-0.5 hover:border-ember-600/50"
            >
              <span className="min-w-0">
                <span className="block font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
                  {link.label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-star">
                  {link.href.replace(/^mailto:|^tel:|^https?:\/\//, "")}
                </span>
              </span>
              <span
                aria-hidden
                className="shrink-0 text-ember-400 opacity-0 transition-all duration-500 ease-expo group-hover:translate-x-0.5 group-hover:opacity-100"
              >
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-8 border-t border-line pt-5 text-[11px] text-faint">
        © {new Date().getFullYear()} {identity.name} · {identity.domain}
      </p>
    </div>
  );
}
