/**
 * @jest-environment node
 */

import { GET } from "@/app/api/leaderboards/role-rank/route";

const entry = {
  pid: 883100,
  name: "carol",
  total_score: 600,
  rank: 41,
};

function request(params: Record<string, string>) {
  const url = new URL("http://localhost/api/leaderboards/role-rank");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url);
}

describe("GET /api/leaderboards/role-rank", () => {
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

  it("returns 400 when role_id is missing", async () => {
    const response = await GET(request({}));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "role_id is required" });
  });

  it("returns 400 for invalid role_id, page, rb3_only, or pid", async () => {
    expect((await GET(request({ role_id: "11" }))).status).toBe(400);
    expect((await GET(request({ role_id: "2", page: "0" }))).status).toBe(400);
    expect((await GET(request({ role_id: "2", rb3_only: "yes" }))).status).toBe(
      400,
    );
    expect((await GET(request({ role_id: "2", pid: "abc" }))).status).toBe(400);
  });

  it("returns 500 when GOCENTRAL_API_BASE_URL is unset", async () => {
    delete process.env.GOCENTRAL_API_BASE_URL;

    const response = await GET(request({ role_id: "2" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
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
      request({ role_id: "2", page: "3", rb3_only: "1" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      leaderboard: [entry],
      page: 3,
      page_size: 20,
    });

    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.toString()).toBe(
      "http://gocentral.test/leaderboards/role-rank?role_id=2&page_size=20&rb3_only=1&page=3",
    );
  });

  it("derives the page from rank when pid is present and omits page upstream", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ leaderboard: [entry] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET(request({ role_id: "2", pid: "883100" }));
    const body = await response.json();

    expect(body.page).toBe(3);
    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.searchParams.get("pid")).toBe("883100");
    expect(upstream.searchParams.has("page")).toBe(false);
  });

  it("normalizes a null leaderboard payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ leaderboard: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET(request({ role_id: "2" }));
    expect(await response.json()).toEqual({
      leaderboard: null,
      page: 1,
      page_size: 20,
    });
  });

  it("maps upstream 400 to 400 and other errors to 502", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("bad request", { status: 400 }),
    );
    const badRequest = await GET(request({ role_id: "2" }));
    expect(badRequest.status).toBe(400);

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("boom", { status: 500 }),
    );
    const upstreamError = await GET(request({ role_id: "2" }));
    expect(upstreamError.status).toBe(502);
  });

  it("returns 502 when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    const response = await GET(request({ role_id: "2" }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Failed to reach GoCentral API",
    });
  });
});
