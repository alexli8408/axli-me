import { SectionOverlays } from "@/components/overlay/SectionOverlays";
import { SkyScene } from "@/components/sky/SkyScene";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";

/**
 * Single screen. The sky fills the viewport and each constellation opens its
 * section as an overlay card.
 *
 * Card bodies are server components, rendered here and handed to the client
 * overlay as nodes, so every word of the resume is in the server-rendered HTML
 * for crawlers rather than being fetched when a card opens.
 */
export default function Home() {
  const cards = [
    { id: "about", content: <About /> },
    { id: "experience", content: <Experience /> },
    { id: "projects", content: <Projects /> },
    { id: "skills", content: <Skills /> },
    { id: "contact", content: <Contact /> },
  ];

  return (
    <SectionOverlays cards={cards}>
      <SkyScene />
    </SectionOverlays>
  );
}
