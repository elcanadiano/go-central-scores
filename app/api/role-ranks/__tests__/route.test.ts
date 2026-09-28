/**
 * @jest-environment node
 */

import { GET } from "@/app/api/role-ranks/route";

const payload = {
  user: { pid: 887100, username: "prr_alice" },
  rankings: [
    {
      role_id: 2,
      total_score: 300,
      total_rank: 2,
      rb3_score: 0,
      rb3_rank: 0,
    },
  ],
};

function request(pid?: string) {
  const url = new URL("http://localhost/api/role-ranks");
  if (pid != null) url.searchParams.set("pid", pid);
  return new Request(url);
}

describe("GET /api/role-ranks", () => {
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

  it("returns 400 when pid is missing or invalid", async () => {
    expect((await GET(request())).status).toBe(400);
    expect((await GET(request("abc"))).status).toBe(400);
  });

  it("proxies a successful response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );
    const response = await GET(request("887100"));
    expect(await response.json()).toEqual(payload);
    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.toString()).toBe(
      "http://gocentral.test/role-ranks?pid=887100",
    );
  });

  it("passes through 404 and maps other failures to 502", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("missing", { status: 404 }),
    );
    const missing = await GET(request("1"));
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "User not found" });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("boom", { status: 500 }),
    );
    expect((await GET(request("1"))).status).toBe(502);
  });

  it("returns 502 when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));
    const response = await GET(request("1"));
    expect(response.status).toBe(502);
  });
});
