export const NAV_ITEMS = [
  { href: "/leaderboards/song", label: "Song leaderboard" },
  { href: "/leaderboards/battle", label: "Battle leaderboard" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
