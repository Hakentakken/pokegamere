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
    title: "Grab the patch",
    body: "Every listing links to its patch file. Apply it to your own legally obtained copy — that is all a patch is.",
    to: "/patcher",
    action: "How patching works",
  },
  {
    title: "Play it anywhere",
    body: "Load the patched ROM in any compatible emulator, then fine-tune it with community cheat codes if you want.",
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
          title="From download to play"
          lede="Three steps, no guesswork. This is the whole loop."
        />

        <ProcessSteps steps={STEPS} />
      </div>
    </section>
  );
}