import Image from "next/image";
import { ThumbClip } from "./ThumbClip";

/**
 * The still that sits under an entry.
 *
 * Empty until there is a file for it, and empty on purpose: a reserved frame
 * reads as a layout waiting to be filled, whereas an entry with nothing under
 * it reads as an entry that is missing something. It holds its aspect either
 * way, so adding a picture never moves anything below it.
 *
 * Cinematic rather than 16:9. At the width of a card, sixteen by nine is tall
 * enough that one entry fills the window and everything under it is a scroll
 * away, and a wide crop suits a site that is already pretending to be a
 * photograph.
 */
export function Thumb({ src, alt, href, credit }: {
  src?: string;
  alt: string;
  /** Where the picture points: the org's site, or the project's source. */
  href?: string;
  /** Photographer and licence, where the licence asks for one. */
  credit?: string;
}) {
  // A path with no extension is a clip: the three files next to it are the two
  // encodings and the poster. Keeps the entry data to one field either way.
  const clip = src && !/\.\w+$/.test(src);

  const frame = (
    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-line/70 bg-gradient-to-br from-sky-850/70 via-sky-900/50 to-sky-950/70">
      {clip ? (
        <ThumbClip
          webm={`${src}.webm`}
          mp4={`${src}.mp4`}
          poster={`${src}.jpg`}
          alt={alt}
        />
      ) : src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 90vw, 40rem"
          className="object-cover"
        />
      ) : null}
    </div>
  );

  return (
    <figure className="mt-3.5">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          // The ring is the only affordance a picture gets, so it has to appear
          // on keyboard focus too, not just under a cursor.
          className="group block rounded-2xl outline-none ring-offset-2 ring-offset-sky-950 focus-visible:ring-2 focus-visible:ring-star/60"
          aria-label={`${alt} (opens in a new tab)`}
        >
          <div className="transition duration-300 group-hover:brightness-110 group-focus-visible:brightness-110">
            {frame}
          </div>
        </a>
      ) : (
        frame
      )}
      {credit ? (
        <figcaption className="mt-1.5 text-[0.65rem] leading-tight text-star/35">
          {credit}
        </figcaption>
      ) : null}
    </figure>
  );
}
