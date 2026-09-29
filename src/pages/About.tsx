import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import LegalSections, { type LegalSection } from "../components/LegalSections";
import CtaBand from "../components/CtaBand";

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
        We collect and organize ROM hacks so players can easily explore new adventures —
        grouping them by base game, documenting what makes each one different, and linking
        straight to the patch, the screenshots and the emulator you need.
      </p>
    ),
  },
  {
    heading: "What we don't do",
    body: (
      <p>
        We do not host commercial game files. Every download link points to a third-party
        source, and you are responsible for obtaining the base game legally yourself.
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
        lede="Every hack page has screenshots, a patch link and the steps to get it running."
        primary={{ label: "Browse ROM Hacks", to: "/hacks" }}
        secondary={{ label: "Read the Q&A", to: "/qa" }}
      />
    </PageWrapper>
  );
}