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

export type BattleInfo = {
  battle_id: number;
  title: string;
  description: string;
  starts_at: number;
  expires_at: number;
  instrument: number;
  song_ids: number[];
};

export type BattlesResponse = {
  battles: BattleInfo[];
};

export type BattleLeaderboardEntry = {
  pid: number;
  name: string;
  score: number;
  rank: number;
  orank: number;
};

export type BattleLeaderboardResponse = {
  leaderboard: BattleLeaderboardEntry[] | null;
};
