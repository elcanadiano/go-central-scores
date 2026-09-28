export const NAV_ITEMS = [
  { href: "/leaderboards/song", label: "Song leaderboard" },
  { href: "/leaderboards/battle", label: "Battle leaderboard" },
  { href: "/leaderboards/role-rank", label: "Role leaderboard" },
  { href: "/role-ranks", label: "My rankings" },
  { href: "/stats", label: "Stats" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
