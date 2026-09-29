import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import LegalSections, { type LegalSection } from "../components/LegalSections";

const YOUTUBE = "https://www.youtube.com/@InvincibleGreninjaIsHere";

const SECTIONS: LegalSection[] = [
  {
    heading: "Cookies",
    body: (
      <p>
        We may use cookies to improve user experience and for analytics. You can block or
        delete cookies in your browser settings; the site will still work, though some
        preferences will not be remembered.
      </p>
    ),
  },
  {
    heading: "Third-party ads",
    body: (
      <p>
        We may display ads through services such as Google AdSense, which may use cookies to
        personalise ads. Ad partners, including Google, may use cookies to serve ads based on
        your visits to this and other sites.
      </p>
    ),
  },
  {
    heading: "Analytics",
    body: (
      <p>
        This site uses Google Analytics to understand which pages are useful. It records
        aggregate, non-personal information about visits — never anything you type.
      </p>
    ),
  },
  {
    heading: "Accounts",
    body: (
      <p>
        The admin area requires a sign-in. Credentials are handled by the authentication
        provider and are never stored by this site.
      </p>
    ),
  },
  {
    heading: "Contact",
    body: (
      <p>
        For any questions, contact us via our YouTube channel:{" "}
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

export default function Privacy() {
  return (
    <PageWrapper>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        lede="PokéSmith respects your privacy. We do not collect personal data unless necessary."
      />

      <div className="shell pb-24">
        <LegalSections sections={SECTIONS} />
      </div>
    </PageWrapper>
  );
}