import type { Metadata } from "next";
import { StatsPage } from "@/components/stats/stats-page";
import { fetchStats } from "@/lib/gocentral/stats";
import { GoCentralApiError } from "@/lib/gocentral/errors";
import { getSongsByIds } from "@/lib/songs/lookup";
import type { GoCentralStats } from "@/lib/gocentral/types";
import type { SongSearchResult } from "@/lib/songs/types";

export const metadata: Metadata = {
  title: "Stats",
  description: "Live GoCentral ecosystem stats.",
};

export default async function Page() {
  let stats: GoCentralStats | null = null;
  let songs: SongSearchResult[] = [];
  let error: string | null = null;

  try {
    stats = await fetchStats();
    try {
      songs = await getSongsByIds(stats.most_popular_song_ids);
    } catch (lookupError) {
      console.error("Failed to load song metadata for stats page:", lookupError);
    }
  } catch (err) {
    if (err instanceof GoCentralApiError) {
      error = err.message;
      console.error("Failed to load stats:", err.message);
    } else {
      error = "Failed to load stats";
      console.error(err);
    }
  }

  return <StatsPage stats={stats} songs={songs} error={error} />;
}
