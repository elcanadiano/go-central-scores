import { Suspense } from "react";
import type { Metadata } from "next";
import { SongLeaderboardPage } from "@/components/leaderboards/song-leaderboard-page";

export const metadata: Metadata = {
  title: "Song leaderboard",
  description: "Search songs and browse top scores by role.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SongLeaderboardPage />
    </Suspense>
  );
}
