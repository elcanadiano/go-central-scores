/**
 * @jest-environment node
 */

import { getSongsByIds } from "@/lib/songs/lookup";
import type { SongSearchResult } from "@/lib/songs/types";

const sqlMock = jest.fn();

jest.mock("@/db/client", () => ({
  getSql: () => sqlMock,
}));

const sampleSongs: SongSearchResult[] = [
  {
    song_id_number: 1083,
    name: "The Middle",
    artist: "Jimmy Eat World",
    album: "Bleed American",
  },
];

describe("getSongsByIds", () => {
  beforeEach(() => {
    sqlMock.mockReset();
    sqlMock.mockResolvedValue(sampleSongs);
  });

  it("returns an empty list for no ids without querying", async () => {
    await expect(getSongsByIds([])).resolves.toEqual([]);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("looks up songs by song_id_number", async () => {
    await expect(getSongsByIds([1083, 1064])).resolves.toEqual(sampleSongs);

    const inCall = sqlMock.mock.calls.find(([strings]) =>
      strings.join("?").includes("song_id_number IN"),
    );
    expect(inCall).toBeDefined();
  });
});
