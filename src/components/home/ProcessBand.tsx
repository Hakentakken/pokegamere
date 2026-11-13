import SectionHeader from "../SectionHeader";
import ProcessSteps, { type Step } from "../ProcessSteps";
import Atmosphere from "../Atmosphere";

const STEPS: Step[] = [
  {
    title: "Pick your adventure",
    body: "Browse the library by base game, read the screenshots, and find the hack that matches the version you already own.",
    to: "/hacks",
    action: "Open the library",
  },
  {
    title: "Check the release",
    body: "Check whether the release is a patch, a standalone game or a patched ROM, then read its requirements and source information.",
    to: "/guides#formats",
    action: "Understand release formats",
  },
  {
    title: "Play it anywhere",
    body: "Follow the creator’s setup instructions for your device. Keep a copy of your save before changing versions or trying cheat codes.",
    to: "/emulators",
    action: "Get an emulator",
  },
];

/** The story chapter — three beats that explain the whole loop in one screen. */
export default function ProcessBand() {
  return (
    <section className="grain relative isolate overflow-hidden border-t border-white/10 bg-ink-900/25">
      <Atmosphere tone="band" grid={false} />

      <div className="shell relative band">
        <SectionHeader
          index="03 —"
          eyebrow="How it works"
          title="Make your next playthrough count"
          lede="Explore the game, understand the release, and keep your progress safe."
        />

        <ProcessSteps steps={STEPS} />
      </div>
    </section>
  );
}
