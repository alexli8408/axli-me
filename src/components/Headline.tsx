import Image from "next/image";
import { identity } from "@/content/resume";

/**
 * The line under the name: what he studies, and where he is working.
 *
 * One component because it appears twice, over the shutter button and then in
 * the corner of the star map, and the two must not be allowed to drift.
 *
 * The school is a wordmark when there is a file for one and its name in words
 * when there is not, so the layout is right either way and adding the mark is a
 * one line change in the content file.
 */
export function Headline({ className = "" }: { className?: string }) {
  const { before, after } = identity.headline;
  const { name, mark, markHeight } = identity.school;

  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 ${className}`}>
      <span>{before}</span>
      {mark ? (
        <Image
          src={mark}
          alt={name}
          height={markHeight}
          width={markHeight * 8}
          className="w-auto opacity-90"
          style={{ height: markHeight }}
        />
      ) : (
        <span>{name}</span>
      )}
      <span>{after}</span>
    </p>
  );
}
