import type { LeaderboardEntry } from "@/lib/gocentral/types";
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

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  } as Response;
}
