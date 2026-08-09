import Link from "next/link";
import type { GoCentralStats } from "@/lib/gocentral/types";
import type { SongSearchResult } from "@/lib/songs/types";

function formatCount(value: number): string {
  return value.toLocaleString();
}

function StatNumber({ value }: { value: number }) {
  return (
    <span className="font-semibold text-foreground">
      {formatCount(value)}
    </span>
  );
}

type PopularSongRow = {
  songId: number;
  scoreCount: number;
};

function buildPopularSongRows(stats: GoCentralStats): PopularSongRow[] {
  const ids = stats.most_popular_song_ids ?? [];
  const counts = stats.most_popular_song_score_counts ?? [];

  return ids.map((songId, index) => ({
    songId,
    scoreCount: counts[index] ?? 0,
  }));
}

type StatsPageProps = {
  stats: GoCentralStats | null;
  songs: SongSearchResult[];
  error: string | null;
};

export function StatsPage({ stats, songs, error }: StatsPageProps) {
  const songById = new Map(songs.map((song) => [song.song_id_number, song]));
  const popularSongs = stats ? buildPopularSongRows(stats) : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">GoCentral</p>
        <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Live ecosystem numbers from GoCentral.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {stats ? (
        <>
          <section className="space-y-2">
            <p className="text-sm text-muted-foreground">
              There are <StatNumber value={stats.scores} /> scores.
            </p>
            <p className="text-sm text-muted-foreground">
              There have been <StatNumber value={stats.machines} /> machines
              that have connected to GoCentral.
            </p>
            <p className="text-sm text-muted-foreground">
              There has been <StatNumber value={stats.setlists} /> setlists
              created.
            </p>
            <p className="text-sm text-muted-foreground">
              There has been <StatNumber value={stats.characters} /> characters
              registered.
            </p>
            <p className="text-sm text-muted-foreground">
              There are <StatNumber value={stats.bands} /> bands.
            </p>
            <p className="text-sm text-muted-foreground">
              There are <StatNumber value={stats.active_gatherings} /> active
              gatherings.
            </p>
          </section>

          {popularSongs.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-foreground">
                Most popular songs
              </h2>
              {popularSongs.map(({ songId, scoreCount }) => {
                const song = songById.get(songId);
                const href = `/leaderboards/song?song_id=${songId}`;

                return (
                  <p
                    key={songId}
                    className="text-sm text-muted-foreground"
                  >
                    <Link
                      href={href}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {song?.name ?? `#${songId}`}
                    </Link>
                    {song?.artist ? <> by {song.artist}</> : null} has{" "}
                    <StatNumber value={scoreCount} /> scores.
                  </p>
                );
              })}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
