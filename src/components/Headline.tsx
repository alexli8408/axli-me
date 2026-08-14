import Image from "next/image";
import { identity } from "@/content/resume";

/**
 * The line under the name: what he studies, and where he is working.
 *
 * One component because it appears twice, over the shutter button and then in
 * the corner of the star map, and the two must not be allowed to drift.
 *
 * The university is set as its own mark. With a file it is the real lockup,
 * shield and all; without one it is the name in type, white and heavier than
 * the line either side of it, which still reads as a wordmark. Either way it
 * occupies the same slot, so adding the image moves nothing else.
 */
export function Headline({ className = "" }: { className?: string }) {
  const { before, after } = identity.headline;
  const { name, mark, markHeight, markRatio } = identity.school;

  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${className}`}>
      <span>{before}</span>
      {mark ? (
        <Image
          src={mark}
          alt={name}
          height={markHeight}
          width={Math.round(markHeight * markRatio)}
          priority
          // The lockup carries its own generous clear space. Nudged up a
          // fraction so the wordmark inside it sits on the same line as the
          // type either side, rather than the file's bounding box doing.
          className="relative -top-px"
        />
      ) : (
        <span className="font-sans font-bold tracking-[0.08em] text-star">{name}</span>
      )}
      <span>{after}</span>
    </p>
  );
}
