import type {
  BattleInfo,
  BattleLeaderboardEntry,
  LeaderboardEntry,
} from "@/lib/gocentral/types";
import type { SongSearchResult } from "@/lib/songs/types";

export const sampleSong: SongSearchResult = {
  song_id_number: 32768,
  name: "The Middle",
  artist: "Jimmy Eat World",
  album: "Bleed American",
};

export const sampleEntry: LeaderboardEntry = {
  pid: 3850,
  name: "Unnamed Band",
  diff_id: 4,
  rank: 1,
  score: 2488149,
  is_percentile: 0,
  inst_mask: 464,
  notes_pct: 100,
  unnamed_band: 0,
  pguid: "",
  orank: 1,
  stars: 6,
};

export function makeEntries(count: number): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    ...sampleEntry,
    pid: 1000 + index,
    rank: index + 1,
    name: `Player ${index + 1}`,
    score: 1_000_000 - index * 1000,
  }));
}

export const sampleBattle: BattleInfo = {
  battle_id: 555555,
  title: "Weekend Warrior",
  description: "A weekly battle",
  starts_at: 1710000000,
  expires_at: 1710086400,
  instrument: 2,
  song_ids: [100, 101, 102],
};

export const sampleBattles: BattleInfo[] = [
  sampleBattle,
  {
    battle_id: 555556,
    title: "Pro Drums Challenge",
    description: "",
    starts_at: 1710000000,
    expires_at: 1710172800,
    instrument: 6,
    song_ids: [200],
  },
];

export const sampleBattleEntry: BattleLeaderboardEntry = {
  pid: 3850,
  name: "Battle Champ",
  score: 50000,
  rank: 1,
  orank: 1,
};

export function makeBattleEntries(count: number): BattleLeaderboardEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    ...sampleBattleEntry,
    pid: 1000 + index,
    rank: index + 1,
    name: `Player ${index + 1}`,
    score: 50_000 - index * 100,
  }));
}

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  } as Response;
}
