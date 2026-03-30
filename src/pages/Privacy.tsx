import PageWrapper from "../components/PageWrapper";

export default function Privacy() {
  return (
    <PageWrapper>
      <div className="min-h-screen text-white p-6 max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-red-500 mb-6">
          Privacy Policy
        </h1>

        <p className="text-gray-300 mb-4">
          PokéSmith respects your privacy. We do not collect personal data unless necessary.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Cookies</h2>
        <p className="text-gray-300">
          We may use cookies to improve user experience and for analytics.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Third-Party Ads</h2>
        <p className="text-gray-300">
          We may display ads through services like Google AdSense, which may use cookies to personalize ads.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
        <p className="text-gray-300">
          For any questions, contact us via our YouTube channel:
          https://www.youtube.com/@InvincibleGreninjaIsHere
        </p>

      </div>
    </PageWrapper>
  );
}