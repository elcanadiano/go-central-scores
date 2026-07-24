import { getSql } from "@/db/client";
import type { SongSearchResult } from "@/lib/songs/types";

const RESULT_LIMIT = 20;

export async function searchSongs(query: string): Promise<SongSearchResult[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }

  const sql = getSql();
  const digitsOnly = /^\d+$/.test(q);

  if (digitsOnly) {
    const songIdNumber = Number(q);
    if (!Number.isSafeInteger(songIdNumber)) {
      return [];
    }

    return sql<SongSearchResult[]>`
      SELECT song_id_number, name, artist, album
      FROM songs
      WHERE song_id_number = ${songIdNumber}
      LIMIT ${RESULT_LIMIT}
    `;
  }

  if (q.length < 2) {
    return [];
  }

  const pattern = `%${q}%`;

  return sql<SongSearchResult[]>`
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
}
