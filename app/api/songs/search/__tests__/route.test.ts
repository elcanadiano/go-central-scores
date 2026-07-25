/**
 * @jest-environment node
 */

import { GET } from "@/app/api/songs/search/route";
import { searchSongs } from "@/lib/songs/search";
import type { SongSearchResult } from "@/lib/songs/types";

jest.mock("@/lib/songs/search", () => ({
  searchSongs: jest.fn(),
}));

const searchSongsMock = jest.mocked(searchSongs);

function request(q?: string) {
  const url = new URL("http://localhost/api/songs/search");
  if (q !== undefined) {
    url.searchParams.set("q", q);
  }
  return new Request(url);
}

describe("GET /api/songs/search", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns songs from searchSongs", async () => {
    const songs: SongSearchResult[] = [
      {
        song_id_number: 32768,
        name: "The Middle",
        artist: "Jimmy Eat World",
        album: "Bleed American",
      },
    ];
    searchSongsMock.mockResolvedValue(songs);

    const response = await GET(request("middle"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(searchSongsMock).toHaveBeenCalledWith("middle");
    expect(body).toEqual({ songs });
  });

  it("passes an empty string when q is omitted", async () => {
    searchSongsMock.mockResolvedValue([]);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(searchSongsMock).toHaveBeenCalledWith("");
    expect(body).toEqual({ songs: [] });
  });

  it("returns 500 when searchSongs throws", async () => {
    searchSongsMock.mockRejectedValue(new Error("db down"));

    const response = await GET(request("middle"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to search songs" });
    expect(console.error).toHaveBeenCalled();
  });
});
