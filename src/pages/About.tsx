import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import LegalSections, { type LegalSection } from "../components/LegalSections";
import CtaBand from "../components/CtaBand";
import { useSeo } from "../lib/seo";

const YOUTUBE = "https://www.youtube.com/@InvincibleGreninjaIsHere";

const SECTIONS: LegalSection[] = [
  {
    heading: "What PokéSmith is",
    body: (
      <p>
        PokéSmith is a platform dedicated to Pokémon ROM hacks, cheats, and emulators. Our
        goal is to provide a clean and simple experience for discovering fan-made Pokémon
        content.
      </p>
    ),
  },
  {
    heading: "What we do",
    body: (
      <p>
        We organize fan projects by base game and platform so players can compare screenshots,
        features and release status. Our player guide explains file formats, compatibility and
        save backups, while each listing brings together the available details about a project.
      </p>
    ),
  },
  {
    heading: "Understanding external releases",
    body: (
      <p>
        Downloads open external sources. The catalogue includes patches, standalone fan games
        and patched ROM files, so check each release’s format and requirements. We credit listed
        creators without claiming ownership of their work or certifying the distribution rights
        of every linked file.
      </p>
    ),
  },
  {
    heading: "The creator",
    body: (
      <p>
        This project is made by the person behind{" "}
        <a
          href={YOUTUBE}
          target="_blank"
          rel="noreferrer"
          className="link-underline text-brand-400 transition-colors duration-300 hover:text-brand-300"
        >
          @InvincibleGreninjaIsHere
        </a>{" "}
        on YouTube, where new gameplay, hack walkthroughs and tutorials are posted.
      </p>
    ),
  },
];

export default function About() {
  useSeo({
    title: "About PokéSmith",
    description: "A fan project for people who would rather be playing than hunting for a working link.",
    canonicalPath: "/about",
  });
  return (
    <PageWrapper>
      <PageHero
        eyebrow="Our story"
        title="About PokéSmith"
        lede="A fan project for people who would rather be playing than hunting for a working link."
      />

      <div className="shell pb-24">
        <LegalSections sections={SECTIONS} />
      </div>

      <CtaBand
        eyebrow="See it in action"
        title="Take a look around"
        lede="Compare game screenshots, features and setup information before choosing your next adventure."
        primary={{ label: "Browse ROM Hacks", to: "/hacks" }}
        secondary={{ label: "Read the Q&A", to: "/qa" }}
      />
    </PageWrapper>
  );
}
