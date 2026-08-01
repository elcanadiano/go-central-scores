/** True when the query is an integer song id (optional leading minus). */
export function isSongIdQuery(query: string): boolean {
  return /^-?\d+$/.test(query);
}

/**
 * Parse a trimmed query as a song_id_number.
 * Returns null when the query is not an integer id or is outside the safe integer range.
 */
export function parseSongIdQuery(query: string): number | null {
  if (!isSongIdQuery(query)) {
    return null;
  }
  const songIdNumber = Number(query);
  return Number.isSafeInteger(songIdNumber) ? songIdNumber : null;
}
