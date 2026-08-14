import { identity } from "@/content/resume";

/**
 * The line under the name: what he studies, and where he is working.
 *
 * One component because it appears twice, over the shutter button and then in
 * the corner of the star map, and the two must not be allowed to drift.
 *
 * The university is set as its wordmark: the words alone, white, heavier and
 * tighter than the text either side of it. Typography rather than an image, so
 * there is no asset to ship, nothing to go blurry, and none of the crest's
 * trademark riding along. It is the one proper noun in the line that a reader
 * is scanning for, so it is the one thing given weight.
 */
export function Headline({ className = "" }: { className?: string }) {
  const { before, after } = identity.headline;

  return (
    <p className={`flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 ${className}`}>
      <span>{before}</span>
      <span className="font-sans font-bold tracking-[0.08em] text-star">
        {identity.school.name}
      </span>
      <span>{after}</span>
    </p>
  );
}
