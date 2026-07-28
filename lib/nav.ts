export const NAV_ITEMS = [
  { href: "/leaderboards/song", label: "Song leaderboard" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
