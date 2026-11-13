import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import LegalSections, { type LegalSection } from "../components/LegalSections";
import CtaBand from "../components/CtaBand";
import { useSeo } from "../lib/seo";

const CONTACT = "mailto:pokesmithoriginal@gmail.com";

const SECTIONS: LegalSection[] = [
  {
    heading: "Questions about a hack",
    body: (
      <p>
        Email the game title, version, device and the issue you encountered. Do not attach game files or passwords.
      </p>
    ),
  },
  {
    heading: "Broken or wrong links",
    body: (
      <p>
        Third-party download links go out of date. Email the game name, the PokeSmith page URL and the
        link that stopped working so we can investigate.
      </p>
    ),
  },
  {
    heading: "Suggestions and corrections",
    body: (
      <p>
        Missing a hack, a wrong description, or a feature list that needs fixing? Email your correction and a source we can check.
      </p>
    ),
  },
  {
    heading: "Takedown requests",
    body: (
      <p>
        If you are a rights holder and want something removed, email us with the page URL, the work concerned, your relationship to it and a way to contact you. Do not include sensitive documents in public comments.
      </p>
    ),
  },
];

export default function Contact() {
  useSeo({
    title: "Contact Us",
    description: "Have questions, suggestions, or want to collaborate?",
    canonicalPath: "/contact",
  });
  return (
    <PageWrapper>
      <PageHero
        eyebrow="Get in touch"
        title="Contact Us"
        lede="Have questions, suggestions, or want to collaborate?"
      >
        <a
          href={CONTACT}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-display font-semibold text-white transition-[border-color,background-color,transform] duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-brand/50 hover:bg-white/10"
        >
          <span
            className="h-2 w-2 rounded-full bg-brand-500 transition-transform duration-500 group-hover:scale-125"
            aria-hidden="true"
          />
          pokesmithoriginal@gmail.com
        </a>
      </PageHero>

      <div className="shell pb-24">
        <LegalSections sections={SECTIONS} />
      </div>

      <CtaBand
        eyebrow="While you're here"
        title="Maybe the answer is already here"
        lede="The Q&A covers patching, emulators and cheats — the questions that come up most."
        primary={{ label: "Open the Q&A", to: "/qa" }}
        secondary={{ label: "Browse hacks", to: "/hacks" }}
      />
    </PageWrapper>
  );
}