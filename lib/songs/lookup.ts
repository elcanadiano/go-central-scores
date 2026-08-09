import { getSql } from "@/db/client";
import type { SongSearchResult } from "@/lib/songs/types";

/** postgres.js returns BIGINT as string; normalize to number for the app. */
function normalizeSongs(
  rows: Array<{
    song_id_number: number | string;
    name: string | null;
    artist: string | null;
    album: string | null;
  }>,
): SongSearchResult[] {
  return rows.map((row) => ({
    song_id_number: Number(row.song_id_number),
    name: row.name,
    artist: row.artist,
    album: row.album,
  }));
}

export async function getSongsByIds(ids: number[]): Promise<SongSearchResult[]> {
  if (ids.length === 0) {
    return [];
  }

  const sql = getSql();
  const rows = await sql<
    Array<{
      song_id_number: number | string;
      name: string | null;
      artist: string | null;
      album: string | null;
    }>
  >`
    SELECT song_id_number, name, artist, album
    FROM songs
    WHERE song_id_number IN ${sql(ids)}
  `;

  return normalizeSongs(rows);
}
