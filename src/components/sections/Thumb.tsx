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
export function Thumb({ src, alt, href, credit, badge }: {
  src?: string;
  alt: string;
  /** Where the picture points: the org's site, or the project's source. */
  href?: string;
  /** Photographer and licence, where the licence asks for one. */
  credit?: string;
  /**
   * Says where the picture goes, on the picture.
   *
   * Only the projects carry one. A brightening on hover is not an affordance
   * on a phone, where there is no hover at all, so a picture that opens
   * something has to say so in words that are always there. The organisation
   * thumbnails go to organisation home pages, which is not worth a label.
   */
  badge?: string;
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

      {href && badge ? (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-line/80 bg-sky-950/80 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-star/85 uppercase backdrop-blur-sm transition-colors duration-300 group-hover:border-ember-400/70 group-hover:text-ember-400">
          <GithubMark />
          {badge}
        </span>
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
          aria-label={`${alt}${badge ? `, ${badge.toLowerCase()}` : ""} (opens in a new tab)`}
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

function GithubMark() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
