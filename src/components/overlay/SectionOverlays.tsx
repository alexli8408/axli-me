"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { constellations } from "@/lib/sky";

type SectionApi = {
  open: (id: string) => void;
  close: () => void;
  /** Called once the sky has resolved, so a deep link can open. */
  notifyReady: () => void;
};

const SectionContext = createContext<SectionApi | null>(null);

export function useSectionOverlays(): SectionApi {
  const ctx = useContext(SectionContext);
  if (!ctx) throw new Error("useSectionOverlays must be used inside <SectionOverlays>");
  return ctx;
}

const ids = new Set(constellations.map((c) => c.id));

export function SectionOverlays({
  cards,
  children,
}: {
  /** Card bodies, rendered on the server and passed through as nodes. */
  cards: { id: string; content: ReactNode }[];
  children: ReactNode;
}) {
  const dialogs = useRef(new Map<string, HTMLDialogElement>());
  const ready = useRef(false);
  const pending = useRef<string | null>(null);

  const closeAll = useCallback((animate = true) => {
    for (const el of dialogs.current.values()) {
      if (!el.open) continue;
      if (!animate) {
        el.close();
        continue;
      }
      // close() is instant, so play the exit first and close on its end.
      el.dataset.closing = "true";
      const done = () => {
        delete el.dataset.closing;
        el.close();
        el.removeEventListener("animationend", done);
      };
      el.addEventListener("animationend", done);
    }
  }, []);

  const show = useCallback(
    (id: string, push: boolean) => {
      const el = dialogs.current.get(id);
      if (!el || el.open) return;

      closeAll(false);
      delete el.dataset.closing;
      el.showModal();

      if (push && location.hash !== `#${id}`) {
        history.pushState({ section: id }, "", `#${id}`);
      }
    },
    [closeAll],
  );

  const open = useCallback(
    (id: string) => {
      if (!ids.has(id)) return;
      if (!ready.current) {
        pending.current = id;
        return;
      }
      show(id, true);
    },
    [show],
  );

  const close = useCallback(() => {
    const id = location.hash.slice(1);
    // Pop the entry that opening pushed, so Back behaves as expected.
    if (ids.has(id)) history.back();
    else closeAll();
  }, [closeAll]);

  const notifyReady = useCallback(() => {
    ready.current = true;
    const id = pending.current ?? location.hash.slice(1);
    pending.current = null;
    if (ids.has(id)) show(id, false);
  }, [show]);

  useEffect(() => {
    const onPop = () => {
      const id = location.hash.slice(1);
      if (ids.has(id)) show(id, false);
      else closeAll();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [show, closeAll]);

  return (
    <SectionContext.Provider value={{ open, close, notifyReady }}>
      {children}

      {cards.map((card) => {
        const c = constellations.find((x) => x.id === card.id);
        if (!c) return null;

        return (
          <dialog
            key={card.id}
            ref={(el) => {
              if (el) dialogs.current.set(card.id, el);
              else dialogs.current.delete(card.id);
            }}
            aria-labelledby={`${card.id}-card-title`}
            onCancel={(e) => {
              // Esc: run the exit animation and the history pop rather than the
              // browser's instant close.
              e.preventDefault();
              close();
            }}
            onClick={(e) => {
              // A click on the dialog itself is the backdrop, since the inner
              // wrapper covers the whole card.
              if (e.target === e.currentTarget) close();
            }}
            className="section-card"
          >
            <div className="flex max-h-[82svh] flex-col">
              <header className="flex items-start justify-between gap-6 border-b border-line px-6 py-5 sm:px-8">
                <div className="min-w-0">
                  <span className="font-mono text-[11px] tracking-[0.28em] text-ember-400 uppercase">
                    {c.kicker} / {c.label}
                  </span>
                  <h2
                    id={`${card.id}-card-title`}
                    className="mt-2 text-2xl font-semibold tracking-tight text-star sm:text-3xl"
                  >
                    {c.title}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{c.intro}</p>
                </div>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="-mt-1 shrink-0 rounded-full border border-line p-2 text-muted transition-colors duration-300 hover:border-line-strong hover:text-star"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="none">
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </header>

              {/* The mask fades the last few lines out instead of guillotining
                  them at the border, which is the only cue that there is more
                  below. It stops at the very bottom so the final line is not
                  left permanently half faded. */}
              <div
                className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-7"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 34px), transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 34px), transparent 100%)",
                }}
              >
                {card.content}
              </div>
            </div>
          </dialog>
        );
      })}
    </SectionContext.Provider>
  );
}
