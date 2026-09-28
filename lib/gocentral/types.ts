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

export type RoleRankEntry = {
  pid: number;
  name: string;
  total_score: number;
  rank: number;
};

export type RoleRankResponse = {
  leaderboard: RoleRankEntry[] | null;
};

export type PlayerRoleRanksUser = {
  pid: number;
  username: string;
};

export type UserSearchResult = PlayerRoleRanksUser;

export type PlayerRoleRank = {
  role_id: number;
  total_score: number;
  total_rank: number;
  rb3_score: number;
  rb3_rank: number;
};

export type PlayerRoleRanks = {
  user: PlayerRoleRanksUser;
  rankings: PlayerRoleRank[];
};

export type GoCentralStats = {
  scores: number;
  machines: number;
  setlists: number;
  characters: number;
  bands: number;
  active_gatherings: number;
  active_gatherings_ps3?: number;
  active_gatherings_wii?: number;
  most_popular_song_ids: number[];
  most_popular_song_score_counts: number[];
};
