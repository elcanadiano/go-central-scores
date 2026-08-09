/**
 * @jest-environment node
 */

import { GET } from "@/app/api/stats/route";
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

describe("GET /api/stats", () => {
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

  it("returns 500 when GOCENTRAL_API_BASE_URL is unset", async () => {
    delete process.env.GOCENTRAL_API_BASE_URL;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "GOCENTRAL_API_BASE_URL is not configured",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("proxies a successful GoCentral response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(sampleStats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ stats: sampleStats });

    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.toString()).toBe("http://gocentral.test/stats");
  });

  it("returns 502 when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "Failed to reach GoCentral API" });
    expect(console.error).toHaveBeenCalled();
  });
});
