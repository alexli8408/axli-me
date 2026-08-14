import Image from "next/image";
import { identity } from "@/content/resume";

/**
 * The line under the name: what he studies, and where he is working.
 *
 * One component because it appears twice, over the shutter button and then in
 * the corner of the star map, and the two must not be allowed to drift.
 *
 * The university is set as its own mark, and by default that mark is type:
 * the words alone, white, in the same family as the name above and half again
 * the size of the line they sit in. The official lockup brings a gold shield
 * with it, which is the loudest thing on a page that is otherwise a night sky.
 * The words carry the same information and belong to the drawing.
 *
 * An image can still take the slot, and occupies the same space either way, so
 * swapping between them moves nothing else on the line.
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
        <span className="font-sans text-[15px] leading-none font-semibold tracking-[0.02em] text-star sm:text-[17px]">
          {name}
        </span>
      )}
      <span>{after}</span>
    </p>
  );
}
