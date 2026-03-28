import PageWrapper from "../components/PageWrapper";

export default function Patcher() {
  return (
    <PageWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-red-500 mb-6">
          🚧 Coming Soon
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg max-w-xl mb-8">
          The ROM Patcher is under development. You'll soon be able to patch games directly in your browser.
        </p>

        {/* Extra UI */}
        <div className="glass p-6 rounded-2xl border border-white/10">
          <p className="text-sm text-gray-300">
            Stay tuned — big features are on the way 👀
          </p>
        </div>

      </div>
    </PageWrapper>
  );
}