/**
 * @jest-environment node
 */

import { fetchStats } from "@/lib/gocentral/stats";
import type { GoCentralStats } from "@/lib/gocentral/types";

const sampleStats: GoCentralStats = {
  scores: 2029743,
  machines: 375,
  setlists: 1922,
  characters: 9984,
  bands: 2067,
  active_gatherings: 7,
  most_popular_song_ids: [1083, 1064, 1033],
  most_popular_song_score_counts: [4667, 4594, 4213],
};

describe("fetchStats", () => {
  const originalBaseUrl = process.env.GOCENTRAL_API_BASE_URL;

  beforeEach(() => {
    process.env.GOCENTRAL_API_BASE_URL = "http://gocentral.test";
    jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.GOCENTRAL_API_BASE_URL = originalBaseUrl;
    jest.restoreAllMocks();
  });

  it("throws when GOCENTRAL_API_BASE_URL is unset", async () => {
    delete process.env.GOCENTRAL_API_BASE_URL;

    await expect(fetchStats()).rejects.toMatchObject({
      message: "GOCENTRAL_API_BASE_URL is not configured",
      status: 500,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches stats from GoCentral", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(sampleStats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(fetchStats()).resolves.toEqual(sampleStats);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
    );

    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.toString()).toBe("http://gocentral.test/stats");
  });

  it("normalizes missing popular song arrays", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          ...sampleStats,
          most_popular_song_ids: undefined,
          most_popular_song_score_counts: undefined,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(fetchStats()).resolves.toEqual({
      ...sampleStats,
      most_popular_song_ids: [],
      most_popular_song_score_counts: [],
    });
  });

  it("maps upstream 400 to 400 and other errors to 502", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("bad request", { status: 400 }),
    );
    await expect(fetchStats()).rejects.toMatchObject({
      message: "Failed to fetch stats",
      status: 400,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("boom", { status: 500 }),
    );
    await expect(fetchStats()).rejects.toMatchObject({
      message: "Failed to fetch stats",
      status: 502,
    });
  });

  it("returns 502 when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    await expect(fetchStats()).rejects.toMatchObject({
      message: "Failed to reach GoCentral API",
      status: 502,
    });
    expect(console.error).toHaveBeenCalled();
  });
});
