/**
 * @jest-environment node
 */

import { GET } from "@/app/api/leaderboards/song/route";
import type { LeaderboardEntry } from "@/lib/gocentral/types";

const entry: LeaderboardEntry = {
  pid: 3850,
  name: "Unnamed Band",
  diff_id: 4,
  rank: 1,
  score: 2488149,
  is_percentile: 0,
  inst_mask: 464,
  notes_pct: 100,
  unnamed_band: 0,
  pguid: "",
  orank: 1,
  stars: 6,
};

function request(params: Record<string, string>) {
  const url = new URL("http://localhost/api/leaderboards/song");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url);
}

describe("GET /api/leaderboards/song", () => {
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

  it("returns 400 when song_id or role_id is missing", async () => {
    const missingSong = await GET(request({ role_id: "2" }));
    expect(missingSong.status).toBe(400);
    expect(await missingSong.json()).toEqual({
      error: "song_id and role_id are required",
    });

    const missingRole = await GET(request({ song_id: "100" }));
    expect(missingRole.status).toBe(400);
    expect(await missingRole.json()).toEqual({
      error: "song_id and role_id are required",
    });
  });

  it("returns 400 for invalid song_id, role_id, or page", async () => {
    expect(
      (await GET(request({ song_id: "abc", role_id: "2" }))).status,
    ).toBe(400);
    expect(
      (await GET(request({ song_id: "1.5", role_id: "2" }))).status,
    ).toBe(400);
    expect(
      (await GET(request({ song_id: "100", role_id: "11" }))).status,
    ).toBe(400);
    expect(
      (await GET(request({ song_id: "100", role_id: "2", page: "0" }))).status,
    ).toBe(400);
  });

  it("accepts zero and negative song ids", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ leaderboard: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const zero = await GET(request({ song_id: "0", role_id: "2" }));
    expect(zero.status).toBe(200);

    const negative = await GET(
      request({ song_id: "-2138671118", role_id: "2" }),
    );
    expect(negative.status).toBe(200);

    const upstream = (global.fetch as jest.Mock).mock.calls[1][0] as URL;
    expect(upstream.searchParams.get("song_id")).toBe("-2138671118");
  });

  it("returns 500 when GOCENTRAL_API_BASE_URL is unset", async () => {
    delete process.env.GOCENTRAL_API_BASE_URL;

    const response = await GET(request({ song_id: "100", role_id: "2" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "GOCENTRAL_API_BASE_URL is not configured",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("proxies a successful GoCentral response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ leaderboard: [entry] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET(
      request({ song_id: "100", role_id: "2", page: "3" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      leaderboard: [entry],
      page: 3,
      page_size: 20,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
    );

    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.toString()).toBe(
      "http://gocentral.test/leaderboards/song?song_id=100&role_id=2&page=3&page_size=20",
    );
  });

  it("normalizes a null leaderboard payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ leaderboard: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET(request({ song_id: "100", role_id: "2" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      leaderboard: null,
      page: 1,
      page_size: 20,
    });
  });

  it("maps upstream 400 to 400 and other errors to 502", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("bad request", { status: 400 }),
    );
    const badRequest = await GET(request({ song_id: "100", role_id: "2" }));
    expect(badRequest.status).toBe(400);
    expect(await badRequest.json()).toEqual({
      error: "Failed to fetch leaderboard",
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("boom", { status: 500 }),
    );
    const upstreamError = await GET(request({ song_id: "100", role_id: "2" }));
    expect(upstreamError.status).toBe(502);
    expect(await upstreamError.json()).toEqual({
      error: "Failed to fetch leaderboard",
    });
  });

  it("returns 502 when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    const response = await GET(request({ song_id: "100", role_id: "2" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "Failed to reach GoCentral API" });
    expect(console.error).toHaveBeenCalled();
  });
});
