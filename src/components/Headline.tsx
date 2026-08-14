import { identity } from "@/content/resume";
import { WaterlooWordmark } from "./WaterlooWordmark";

/**
 * The line under the name: what he studies, and where he is working.
 *
 * One component because it appears twice, over the shutter button and then in
 * the corner of the star map, and the two must not be allowed to drift.
 *
 * The university is its real wordmark, words only, sized taller than the type
 * either side of it. It stacks onto two lines the way the mark does, so it
 * needs the height to stay legible, and it is the one proper noun in the line
 * anyone is scanning for.
 */
export function Headline({ className = "", markClass = "h-6 sm:h-7" }: {
  className?: string;
  markClass?: string;
}) {
  const { before, after } = identity.headline;

  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 ${className}`}>
      <span>{before}</span>
      <WaterlooWordmark className={`${markClass} w-auto text-star`} />
      <span>{after}</span>
    </p>
  );
}
