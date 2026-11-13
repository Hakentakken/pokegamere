import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import PageHero from '../components/PageHero';
import { useSeo } from '../lib/seo';

const chapters = [{ id: 'choose', label: 'Choose a release' }, { id: 'formats', label: 'Understand file formats' }, { id: 'sources', label: 'Check the source' }, { id: 'saves', label: 'Protect your save' }];
const sectionClass = 'scroll-mt-28 border-t border-white/10 pt-9';
const headingClass = 'font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl';

export default function Guides() {
  useSeo({ title: 'A player’s guide to Pokémon fan games & ROM hacks', description: 'Compare releases, understand patches and standalone games, check download sources, and protect your saves before your next fan-made adventure.', canonicalPath: '/guides' });
  return <PageWrapper>
    <PageHero eyebrow="The player’s field guide" title="Find your next adventure. Know it before you play." lede="A practical guide to reading game listings, understanding release formats and keeping your progress intact." />
    <div className="shell grid gap-10 pb-24 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
      <aside><nav aria-label="Guide chapters" className="lg:sticky lg:top-28"><p className="type-overline text-neutral-500">In this guide</p><ol className="mt-5 space-y-4">{chapters.map((chapter, index) => <li key={chapter.id}><a className="flex gap-3 text-sm text-neutral-300 hover:text-brand-400" href={`#${chapter.id}`}><span className="font-mono text-brand-400">0{index + 1}</span>{chapter.label}</a></li>)}</ol><p className="mt-8 border-t border-white/10 pt-5 text-xs leading-relaxed text-neutral-500">Written for PokéSmith readers. General setup guidance, not a playtest or certification of individual releases.</p></nav></aside>
      <article className="max-w-3xl space-y-12 text-base leading-relaxed text-neutral-300">
        <section id="choose" className={sectionClass}><h2 className={headingClass}>01 / Choose the release, not just the cover</h2>
          <p className="mt-5">Two games built on the same Pokémon title can offer very different experiences. One may keep the original story and change battles; another may introduce a new region or only a short playable demo. Start with what you want to play: a familiar journey with new rules, a story to explore, or a challenge built around team planning.</p>
          <p className="mt-4">Read the feature list alongside the description. A feature such as a larger Pokédex does not tell you when those Pokémon become available, and a completed label does not establish that every side quest is finished. Look for the creator’s release notes when the scope is unclear. Compare screenshots to understand the interface and presentation, rather than treating the cover image as gameplay.</p>
          <p className="mt-4">Next check platform and release status. A desktop fan game may need a particular operating system or runtime; a GBA modification needs a compatible GBA setup. A demo can be worth playing, but you should know its stopping point before investing hours in a save. If an entry does not provide that information, ask the creator or <Link to="/contact" className="link-underline text-brand-400">send us a correction request</Link>.</p>
        </section>
        <section id="formats" className={sectionClass}><h2 className={headingClass}>02 / Understand the file format</h2>
          <p className="mt-5">PokéSmith’s external links include mixed release formats. The title of a listing does not tell you what the linked archive contains. Check the source’s description and file details before downloading.</p>
          <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
            <div className="grid gap-3 py-5 sm:grid-cols-[10rem_1fr]"><dt className="font-semibold text-white">Patch file</dt><dd>A file such as IPS, UPS or BPS describes changes to a base game. It generally requires a specific base-game revision and a compatible patching tool. A matching filename alone does not confirm that the base file is correct.</dd></div>
            <div className="grid gap-3 py-5 sm:grid-cols-[10rem_1fr]"><dt className="font-semibold text-white">Standalone fan game</dt><dd>A release that runs through its own application or runtime rather than by patching a commercial ROM. Read its system requirements and installation notes. “Standalone” describes how it runs; it does not certify ownership of its artwork, music or other assets.</dd></div>
            <div className="grid gap-3 py-5 sm:grid-cols-[10rem_1fr]"><dt className="font-semibold text-white">Patched ROM</dt><dd>A game image with modifications already applied. It may also contain data from the original game. Permission to share a modification does not by itself establish permission to redistribute the original material included in that file.</dd></div>
          </dl>
          <p className="mt-5">For a patch-based release, follow the creator’s instructions for the required region, revision and checksum when supplied. Start from the specified base file and avoid stacking unrelated patches. An archive extension such as ZIP only describes the container, not whether its contents are a patch, a game image or an executable.</p>
        </section>
        <section id="sources" className={sectionClass}><h2 className={headingClass}>03 / Read the source before the download</h2>
          <p className="mt-5">Use the release page to check who published the file, which version it contains, and whether there are known issues or installation instructions. A file-hosting service is a delivery location, not evidence that a file is an official release. Compare the source with the creator’s own announcement when available.</p>
          <p className="mt-4">Keep the release notes and version number with your game files. If something breaks later, those details make it easier to distinguish an emulator issue from a release-specific bug. Avoid unrelated installers or browser extensions offered next to a download button. PokéSmith cannot independently certify every linked file’s contents, safety or distribution permissions.</p>
          <p className="mt-4">If the source is missing, the file format is unclear, or a download no longer matches the listing, report the exact PokéSmith page and the issue. Credit and permission are different questions: naming a creator helps attribution, while redistribution still depends on the rights in the material being shared. For background, the <a href="https://www.copyright.gov/circs/circ14.pdf" className="link-underline text-brand-400">U.S. Copyright Office explains derivative works</a>; applicable rules depend on your jurisdiction.</p>
        </section>
        <section id="saves" className={sectionClass}><h2 className={headingClass}>04 / Keep a way back to your save</h2>
          <p className="mt-5">Before updating, make an in-game save and copy the save file to a separate folder. Keep the old release until you have confirmed that the new version loads your progress correctly. Do not assume that an emulator save state is portable between game versions; it can depend on the exact state of the older release.</p>
          <p className="mt-4">Read migration instructions before renaming or replacing files. Some releases change their save format, folder location or internal game structure. If the creator recommends a fresh save, moving an old one into the new release can produce problems that are not immediately visible.</p>
          <p className="mt-4">Test the update before committing to a long session: load the save, check your party and inventory, move between a few locations, and save again to a separate slot if supported. When reporting a problem, include the release version, device, emulator or runtime, and whether cheats or other patches were active.</p>
        </section>
        <footer className="border-t border-white/10 pt-8"><p>Ready to compare games? <Link to="/hacks" className="link-underline text-brand-400">Explore the catalogue</Link>, or read our <Link to="/editorial" className="link-underline text-brand-400">editorial standards</Link> to understand creator credits and catalogue ratings.</p></footer>
      </article>
    </div>
  </PageWrapper>;
}
