import { getSql } from "@/db/client";

export type SongCounts = {
  total: number;
  withInfo: number;
};

export async function getSongCounts(): Promise<SongCounts> {
  const sql = getSql();
  const [row] = await sql<
    Array<{ total: number | string; with_info: number | string }>
  >`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE name IS NOT NULL)::int AS with_info
    FROM songs
  `;

  return {
    total: Number(row?.total ?? 0),
    withInfo: Number(row?.with_info ?? 0),
  };
}
