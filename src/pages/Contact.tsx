import PageWrapper from "../components/PageWrapper";

export default function Contact() {
  return (
    <PageWrapper>
      <div className="min-h-screen text-white p-6 max-w-3xl mx-auto">

        <h1 className="text-4xl font-bold text-red-500 mb-6">
          Contact Us
        </h1>

        <p className="text-gray-300 mb-4">
          Have questions, suggestions, or want to collaborate?
        </p>

        <div className="glass p-6 rounded-xl">
          <p className="text-gray-300">
            Reach us on YouTube:
          </p>

          <a
            href="https://www.youtube.com/@InvincibleGreninjaIsHere"
            target="_blank"
            className="text-red-400 block mt-2"
          >
            @InvincibleGreninjaIsHere
          </a>
        </div>

      </div>
    </PageWrapper>
  );
}