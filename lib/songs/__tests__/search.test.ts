/**
 * @jest-environment node
 */

import { searchSongs } from "@/lib/songs/search";
import type { SongSearchResult } from "@/lib/songs/types";

const sqlMock = jest.fn();

jest.mock("@/db/client", () => ({
  getSql: () => sqlMock,
}));

const sampleSongs: SongSearchResult[] = [
  {
    song_id_number: 32768,
    name: "The Middle",
    artist: "Jimmy Eat World",
    album: "Bleed American",
  },
];

describe("searchSongs", () => {
  beforeEach(() => {
    sqlMock.mockReset();
    sqlMock.mockResolvedValue(sampleSongs);
  });

  it("returns an empty list for blank queries without querying", async () => {
    await expect(searchSongs("")).resolves.toEqual([]);
    await expect(searchSongs("   ")).resolves.toEqual([]);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("looks up an exact song_id_number for digit queries", async () => {
    await expect(searchSongs("32768")).resolves.toEqual(sampleSongs);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const [strings, songIdNumber, limit] = sqlMock.mock.calls[0] as [
      TemplateStringsArray,
      number,
      number,
    ];
    expect(strings.join("?")).toContain("song_id_number =");
    expect(strings.join("?")).not.toContain("ILIKE");
    expect(songIdNumber).toBe(32768);
    expect(limit).toBe(20);
  });

  it("looks up zero and negative song_id_number values", async () => {
    await searchSongs("0");
    expect(sqlMock.mock.calls[0]?.[1]).toBe(0);

    sqlMock.mockClear();
    await searchSongs("-2138671118");
    expect(sqlMock.mock.calls[0]?.[1]).toBe(-2138671118);
    expect(String(sqlMock.mock.calls[0]?.[0].join("?"))).toContain(
      "song_id_number =",
    );
  });

  it("trims digit queries before exact lookup", async () => {
    await searchSongs("  42  ");

    const [, songIdNumber] = sqlMock.mock.calls[0] as [
      TemplateStringsArray,
      number,
      number,
    ];
    expect(songIdNumber).toBe(42);
  });

  it("returns an empty list for unsafe digit ids", async () => {
    await expect(searchSongs("9".repeat(20))).resolves.toEqual([]);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("returns an empty list for a lone minus sign", async () => {
    await expect(searchSongs("-")).resolves.toEqual([]);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("returns an empty list for single-character text queries", async () => {
    await expect(searchSongs("a")).resolves.toEqual([]);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("runs a case-insensitive partial search for text queries", async () => {
    await expect(searchSongs("middle")).resolves.toEqual(sampleSongs);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const [strings, ...values] = sqlMock.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];
    const sqlText = strings.join("?");
    expect(sqlText).toContain("ILIKE");
    expect(sqlText).toContain("ORDER BY name2");
    expect(values.slice(0, -1)).toEqual([
      "%middle%",
      "%middle%",
      "%middle%",
      "%middle%",
      "%middle%",
      "%middle%",
    ]);
    expect(values.at(-1)).toBe(20);
  });
});
