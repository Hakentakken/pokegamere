import PageWrapper from "../components/PageWrapper";

export default function About() {
  return (
    <PageWrapper>
      <div className="min-h-screen text-white p-6 max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-red-500 mb-6">
          About PokéForge
        </h1>

        <p className="text-gray-300 mb-4">
          PokéForge is a platform dedicated to Pokémon ROM hacks, cheats, and emulators.
          Our goal is to provide a clean and simple experience for discovering fan-made Pokémon content.
        </p>

        <p className="text-gray-300 mb-4">
          We collect and organize the best ROM hacks so players can easily explore new adventures.
        </p>

        <div className="glass p-4 rounded-xl mt-6">
          <h2 className="text-xl font-semibold mb-2">Creator</h2>
          <p className="text-gray-300">
            YouTube: 
            <a 
              href="https://www.youtube.com/@InvincibleGreninjaIsHere" 
              target="_blank"
              className="text-red-400 ml-2"
            >
              @InvincibleGreninjaIsHere
            </a>
          </p>
        </div>

      </div>
    </PageWrapper>
  );
}