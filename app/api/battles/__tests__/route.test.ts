/**
 * @jest-environment node
 */

import { GET } from "@/app/api/battles/route";
import { sampleBattles } from "@/components/leaderboards/test-utils/fixtures";

describe("GET /api/battles", () => {
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
      new Response(JSON.stringify({ battles: sampleBattles }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ battles: sampleBattles });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
    );

    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.toString()).toBe("http://gocentral.test/battles");
  });

  it("normalizes a missing battles array", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ battles: [] });
  });

  it("maps upstream 400 to 400 and other errors to 502", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("bad request", { status: 400 }),
    );
    const badRequest = await GET();
    expect(badRequest.status).toBe(400);
    expect(await badRequest.json()).toEqual({
      error: "Failed to fetch battles",
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("boom", { status: 500 }),
    );
    const upstreamError = await GET();
    expect(upstreamError.status).toBe(502);
    expect(await upstreamError.json()).toEqual({
      error: "Failed to fetch battles",
    });
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
