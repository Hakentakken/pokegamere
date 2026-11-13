import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import PageHero from '../components/PageHero';
import LegalSections, { type LegalSection } from '../components/LegalSections';
import { useSeo } from '../lib/seo';

const sections: LegalSection[] = [
  { heading: 'A catalogue, not a testing certification', body: <p>PokéSmith organizes fan-made Pokémon games by their base game, platform, release status, descriptions and screenshots. A listing does not mean that every release has been played through or independently tested. Check the creator’s current release notes before downloading.</p> },
  { heading: 'What a useful listing includes', body: <p>A clear description should explain the setting, the main changes from the base game and who the game may suit. Features, screenshots and release status help you compare games. Missing information is a reason to check the source, not a promise that a feature exists.</p> },
  { heading: 'Creators and attribution', body: <p>The author field identifies the creator named in the listing. PokéSmith does not claim ownership of listed games, artwork or screenshots. Pokémon and related trademarks belong to their respective owners; this site is an independent fan project.</p> },
  { heading: 'Ratings and release status', body: <p>Catalogue ratings are entered by the site administrator. They are not an aggregate of verified player reviews. Status labels reflect the listing information and can become outdated when a creator publishes a new version. Neither a rating nor a completed label guarantees compatibility or an error-free game.</p> },
  { heading: 'Downloads and corrections', body: <p>Download buttons open external sources containing a mix of patches, standalone fan games and patched ROM files. File formats and distribution permissions need checking per release. PokéSmith does not independently certify every linked file as safe or authorize the use of copyrighted game data. If an entry is incorrect, a link is broken, or you have a rights concern, email <a className="link-underline text-brand-400" href="mailto:pokesmithoriginal@gmail.com">pokesmithoriginal@gmail.com</a> with the page URL and a source or explanation. See our <Link className="link-underline text-brand-400" to="/terms">terms</Link> and <Link className="link-underline text-brand-400" to="/privacy">privacy policy</Link>.</p> },
];

export default function Editorial() {
  useSeo({ title: 'Editorial standards & corrections', description: 'How to read PokéSmith game listings, creator credits, catalogue ratings and release information, and how to report a correction.', canonicalPath: '/editorial' });
  return <PageWrapper><PageHero eyebrow="Behind the catalogue" title="Editorial standards" lede="What our listings tell you, what they do not, and how to help keep them accurate." /><div className="shell pb-24"><LegalSections sections={sections} /></div></PageWrapper>;
}
