import { identity } from "@/content/resume";
import { WaterlooWordmark } from "./WaterlooWordmark";

/**
 * The line under the name: what he studies, and where he is working.
 *
 * One component because it appears twice, over the shutter button and then in
 * the corner of the star map, and the two must not be allowed to drift.
 *
 * The university is its real wordmark, words only. It stacks onto two lines the
 * way the mark does, so it needs a little more height than the type either side
 * of it just to stay legible, but only a little: it is one item in a line, not
 * the headline. Held back off full white for the same reason, so it sits with
 * the rest of the line rather than shouting over it.
 */
export function Headline({ className = "", markClass = "h-5 sm:h-6" }: {
  className?: string;
  markClass?: string;
}) {
  const { before, after } = identity.headline;

  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 ${className}`}>
      <span>{before}</span>
      <WaterlooWordmark className={`${markClass} w-auto text-star/75`} />
      <span>{after}</span>
    </p>
  );
}
