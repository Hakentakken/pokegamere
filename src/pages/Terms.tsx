import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import LegalSections, { type LegalSection } from "../components/LegalSections";
import Reveal from "../components/Reveal";

const YOUTUBE = "https://www.youtube.com/@InvincibleGreninjaIsHere";

const SECTIONS: LegalSection[] = [
  {
    heading: "What this site is",
    body: (
      <p>
        PokéSmith is a fan-made catalogue of Pokémon ROM hacks, cheat codes and emulator
        downloads. It is a hobby project maintained for fans. The site links to content that
        already exists elsewhere; it is not a commercial service.
      </p>
    ),
  },
  {
    heading: "We do not host game files",
    body: (
      <p>
        PokéSmith does not host, upload or distribute commercial ROMs, ISOs or game
        cartridges. Download links point to third-party sources, and users are responsible for
        obtaining any base game legally through their own copy.
      </p>
    ),
  },
  {
    heading: "Fan-made content and trademarks",
    body: (
      <p>
        Pokémon and related names and assets belong to their respective owners. This project is
        unofficial and is not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak,
        The Pokémon Company or any other rights holder. All listed hacks, patches and guides remain
        the work of their original creators, who retain copyright in them.
      </p>
    ),
  },
  {
    heading: "Downloads, patches and your device",
    body: (
      <p>
        Patch files and third-party downloads are provided as-is. Applying a patch requires your
        own legally obtained base game, and any software you download is used at your own risk.
        Check local law before downloading or playing any modification.
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
        Questions, takedown requests or corrections can be raised through our YouTube channel:{" "}
        <a
          href={YOUTUBE}
          target="_blank"
          rel="noreferrer"
          className="link-underline text-brand-400 transition-colors duration-300 hover:text-brand-300"
        >
          {YOUTUBE}
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
            PokéSmith is a fan project. It indexes work created by other people and never hosts
            commercial game files.
          </p>
        </Reveal>

        <LegalSections sections={SECTIONS} />

        <Reveal delay={0.2}>
          <p className="mt-12 max-w-2xl rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-neutral-500">
            <strong className="font-semibold text-neutral-300">Note for reviewers:</strong> the
            wording above is an honest description of this project's behaviour, written without
            legal input. It is a starting structure only — have it reviewed before relying on it
            for any compliance purpose.
          </p>
        </Reveal>
      </div>
    </PageWrapper>
  );
}