import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import LegalSections, { type LegalSection } from "../components/LegalSections";
import Reveal from "../components/Reveal";
import { useSeo } from "../lib/seo";

const CONTACT = "mailto:pokesmithoriginal@gmail.com";

const SECTIONS: LegalSection[] = [
  {
    heading: "What this site is",
    body: (
      <p>
        PokéSmith is a fan-made catalogue of Pokémon ROM hacks, cheat codes and emulator
        downloads. It is a hobby project maintained for fans. The site links to content that
        already exists elsewhere; it may display advertising.
      </p>
    ),
  },
  {
    heading: "External releases and file formats",
    body: (
      <p>
        Download links on PokéSmith point to external sources. The catalogue includes patch
        files, standalone fan games and patched ROM files. These formats are different:
        a patched ROM can contain original game data as well as a creator’s modifications.
        A listing, creator credit or external hosting location does not establish permission
        to redistribute all material in a release.
      </p>
    ),
  },
  {
    heading: "Fan-made content and trademarks",
    body: (
      <p>
        Pokémon and related names and assets belong to their respective owners. This project is
        unofficial and is not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak,
        The Pokémon Company or any other rights holder. Credits identify the listed project’s
        creator; they do not imply that the creator owns all underlying game assets or that
        the original rights holders have endorsed the project.
      </p>
    ),
  },
  {
    heading: "Downloads, patches and your device",
    body: (
      <p>
        Read the source’s release notes, file format and permissions before downloading.
        A patch generally requires a specified base-game version; a standalone fan game has
        its own system requirements. PokéSmith does not provide a blanket legal or safety
        certification for linked releases. Obtain any required base game lawfully and check
        the permissions and laws applicable to your use.
      </p>
    ),
  },
  {
    heading: "Links to other sites",
    body: (
      <p>
        The catalogue contains outbound links to sites we do not control. We are not responsible
        for their content, availability or practices. If a link breaks or points somewhere
        inappropriate, please let us know.
      </p>
    ),
  },
  {
    heading: "Accuracy and availability",
    body: (
      <p>
        Listings, ratings and download links are maintained on a best-effort basis and may change
        or become outdated. Features may be added, altered or removed without notice.
      </p>
    ),
  },
  {
    heading: "Contact",
    body: (
      <p>
        Questions, takedown requests or corrections can be raised by email:{" "}
        <a
          href={CONTACT}
          target="_blank"
          rel="noreferrer"
          className="link-underline text-brand-400 transition-colors duration-300 hover:text-brand-300"
        >
          pokesmithoriginal@gmail.com
        </a>
        .
      </p>
    ),
  },
];

/**
 * Terms & Disclaimer.
 *
 * IMPORTANT: this page is plain-language project copy written to describe what the
 * site actually does. It has not been reviewed by a lawyer, and it is not legal
 * advice — the sections marked below are placeholders that should be replaced or
 * confirmed by qualified counsel before being relied on.
 */
export default function Terms() {
  useSeo({
    title: "Terms & Disclaimer",
    description: "The plain-language version of how this project works, what it hosts, and what it does not.",
    canonicalPath: "/terms",
  });
  return (
    <PageWrapper>
      <PageHero
        eyebrow="Legal"
        title="Terms & Disclaimer"
        lede="The plain-language version of how this project works, what it hosts, and what it does not."
      />

      <div className="shell pb-24">
        <Reveal delay={0.1}>
          <p className="type-lede max-w-2xl">
            PokéSmith is an independent fan project for discovering and understanding fan-made
            games and modifications. This page explains how listings, external releases and
            rights-related requests are handled.
          </p>
        </Reveal>

        <LegalSections sections={SECTIONS} />


      </div>
    </PageWrapper>
  );
}
