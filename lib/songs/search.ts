import { getSql } from "@/db/client";
import { isSongIdQuery, parseSongIdQuery } from "@/lib/songs/song-id";
import type { SongSearchResult } from "@/lib/songs/types";

const RESULT_LIMIT = 20;

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

export async function searchSongs(query: string): Promise<SongSearchResult[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }

  if (isSongIdQuery(q)) {
    const songIdNumber = parseSongIdQuery(q);
    if (songIdNumber == null) {
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
      WHERE song_id_number = ${songIdNumber}
      LIMIT ${RESULT_LIMIT}
    `;
    return normalizeSongs(rows);
  }

  if (q.length < 2) {
    return [];
  }

  const sql = getSql();
  const pattern = `%${q}%`;

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
    WHERE
      name ILIKE ${pattern}
      OR name2 ILIKE ${pattern}
      OR artist ILIKE ${pattern}
      OR artist2 ILIKE ${pattern}
      OR album ILIKE ${pattern}
      OR album2 ILIKE ${pattern}
    ORDER BY name2 NULLS LAST, artist2 NULLS LAST, album2 NULLS LAST
    LIMIT ${RESULT_LIMIT}
  `;
  return normalizeSongs(rows);
}
