/**
 * @jest-environment node
 */

import { GET } from "@/app/api/songs/by-ids/route";
import { getSongsByIds } from "@/lib/songs/lookup";
import type { SongSearchResult } from "@/lib/songs/types";

jest.mock("@/lib/songs/lookup", () => ({
  getSongsByIds: jest.fn(),
}));

const getSongsByIdsMock = jest.mocked(getSongsByIds);

function request(ids?: string) {
  const url = new URL("http://localhost/api/songs/by-ids");
  if (ids !== undefined) {
    url.searchParams.set("ids", ids);
  }
  return new Request(url);
}

describe("GET /api/songs/by-ids", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns songs from getSongsByIds", async () => {
    const songs: SongSearchResult[] = [
      {
        song_id_number: 1083,
        name: "The Middle",
        artist: "Jimmy Eat World",
        album: "Bleed American",
      },
    ];
    getSongsByIdsMock.mockResolvedValue(songs);

    const response = await GET(request("1083,1064"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getSongsByIdsMock).toHaveBeenCalledWith([1083, 1064]);
    expect(body).toEqual({ songs });
  });

  it("returns an empty list when ids is omitted", async () => {
    getSongsByIdsMock.mockResolvedValue([]);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getSongsByIdsMock).toHaveBeenCalledWith([]);
    expect(body).toEqual({ songs: [] });
  });

  it("skips invalid id segments", async () => {
    getSongsByIdsMock.mockResolvedValue([]);

    const response = await GET(request("1083,abc,1064,"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getSongsByIdsMock).toHaveBeenCalledWith([1083, 1064]);
    expect(body).toEqual({ songs: [] });
  });

  it("returns 500 when getSongsByIds throws", async () => {
    getSongsByIdsMock.mockRejectedValue(new Error("db down"));

    const response = await GET(request("1083"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to look up songs" });
    expect(console.error).toHaveBeenCalled();
  });
});
