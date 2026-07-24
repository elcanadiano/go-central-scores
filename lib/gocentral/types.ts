export type LeaderboardEntry = {
  pid: number;
  name: string;
  diff_id: number;
  rank: number;
  score: number;
  is_percentile: number;
  inst_mask: number;
  notes_pct: number;
  unnamed_band: number;
  pguid: string;
  orank: number;
  stars: number;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[] | null;
};
