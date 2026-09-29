export type NavItem = { to: string; label: string };

/** Minimal shape of the signed-in admin account (id is all the UI needs). */
export type SessionUser = { id?: string } | null;

/** Primary destinations — shown in the bar, first in the mobile drawer. */
export const PRIMARY: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/hacks", label: "Hacks" },
  { to: "/cheats", label: "Cheats" },
  { to: "/emulators", label: "Emulators" },
  { to: "/patcher", label: "Patcher" },
  { to: "/qa", label: "Q&A" },
];

/** Quieter utility destinations — mobile drawer only, as before. */
export const SECONDARY: NavItem[] = [
  { to: "/about", label: "About" },
  { to: "/privacy", label: "Privacy" },
];