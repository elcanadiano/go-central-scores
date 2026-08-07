/**
 * @jest-environment node
 */

import { GET } from "@/app/api/leaderboards/battle/route";
import { sampleBattleEntry } from "@/components/leaderboards/test-utils/fixtures";

function request(params: Record<string, string>) {
  const url = new URL("http://localhost/api/leaderboards/battle");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url);
}

describe("GET /api/leaderboards/battle", () => {
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

  it("returns 400 when battle_id is missing", async () => {
    const response = await GET(request({}));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "battle_id is required",
    });
  });

  it("returns 400 for invalid battle_id or page", async () => {
    expect((await GET(request({ battle_id: "abc" }))).status).toBe(400);
    expect((await GET(request({ battle_id: "1.5" }))).status).toBe(400);
    expect((await GET(request({ battle_id: "100", page: "0" }))).status).toBe(
      400,
    );
  });

  it("returns 500 when GOCENTRAL_API_BASE_URL is unset", async () => {
    delete process.env.GOCENTRAL_API_BASE_URL;

    const response = await GET(request({ battle_id: "555555" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "GOCENTRAL_API_BASE_URL is not configured",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("proxies a successful GoCentral response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ leaderboard: [sampleBattleEntry] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET(
      request({ battle_id: "555555", page: "2" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      leaderboard: [sampleBattleEntry],
      page: 2,
      page_size: 20,
    });

    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.toString()).toBe(
      "http://gocentral.test/leaderboards/battle?battle_id=555555&page=2&page_size=20",
    );
  });

  it("normalizes a null leaderboard payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ leaderboard: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET(request({ battle_id: "555555" }));
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
    const badRequest = await GET(request({ battle_id: "555555" }));
    expect(badRequest.status).toBe(400);
    expect(await badRequest.json()).toEqual({
      error: "Failed to fetch leaderboard",
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("boom", { status: 500 }),
    );
    const upstreamError = await GET(request({ battle_id: "555555" }));
    expect(upstreamError.status).toBe(502);
    expect(await upstreamError.json()).toEqual({
      error: "Failed to fetch leaderboard",
    });
  });

  it("returns 502 when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    const response = await GET(request({ battle_id: "555555" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "Failed to reach GoCentral API" });
    expect(console.error).toHaveBeenCalled();
  });
});
