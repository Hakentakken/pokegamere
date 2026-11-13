import PageWrapper from "../components/PageWrapper";
import PageHero from "../components/PageHero";
import LegalSections, { type LegalSection } from "../components/LegalSections";
import { useSeo } from "../lib/seo";

const SECTIONS: LegalSection[] = [
  { heading: "Who operates this site", body: <p>PokeSmith is an independent fan project. Contact pokesmithoriginal@gmail.com with privacy questions or a request concerning information you have sent us.</p> },
  { heading: "Visits and analytics", body: <p>Google Analytics is used to measure visits and page interactions. It can process browser and device details, page URLs, referral information and cookie identifiers. Technical request information is also processed by our hosting and database providers to deliver the site. These services should not be treated as anonymous.</p> },
  { heading: "Cookies and local storage", body: <p>Your light or dark theme preference is saved in browser local storage. Administrator authentication uses browser storage to maintain a session. Google Analytics and, when advertising is served, Google advertising services may use cookies or similar identifiers. Browser settings let you clear storage or block cookies.</p> },
  { heading: "Advertising", body: <p>The site includes Google AdSense code. When ads are served, Google and its partners may use cookies to show ads based on visits to this and other sites. You can manage personalized advertising in <a className="link-underline text-brand-400" href="https://myadcenter.google.com/">Google My Ad Center</a>. See <a className="link-underline text-brand-400" href="https://policies.google.com/technologies/partner-sites">how Google uses information from partner sites</a>.</p> },
  { heading: "External content and downloads", body: <p>Images may load from external image hosts, and the homepage contains a YouTube video. Those providers receive requests from your browser. Download links take you to third-party websites with their own privacy practices; this policy does not govern those sites.</p> },
  { heading: "Administrator accounts", body: <p>Public browsing does not require an account. Administrator sign-in is handled by Supabase Authentication, which processes account and session information. Never send your password or access tokens to our contact address.</p> },
  { heading: "Messages and requests", body: <p>If you email us, your address and message are used to respond and investigate the issue. Avoid attaching sensitive personal information. To ask for a correction or deletion of information you supplied, email <a className="link-underline text-brand-400" href="mailto:pokesmithoriginal@gmail.com">pokesmithoriginal@gmail.com</a>. Provider-managed information may also require a request to that provider.</p> },
];

export default function Privacy() {
  useSeo({
    title: "Privacy Policy",
    description: "How site storage, analytics, advertising and contact messages are handled.",
    canonicalPath: "/privacy",
  });
  return (
    <PageWrapper>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        lede="How site storage, analytics, advertising and contact messages are handled."
      />

      <div className="shell pb-24">
        <LegalSections sections={SECTIONS} />
      </div>
    </PageWrapper>
  );
}