/**
 * @jest-environment node
 */

import { GET } from "@/app/api/users/search/route";

const user = { pid: 886100, username: "elcanadiano" };

function request(q?: string) {
  const url = new URL("http://localhost/api/users/search");
  if (q != null) url.searchParams.set("q", q);
  return new Request(url);
}

describe("GET /api/users/search", () => {
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

  it("returns 400 when q is missing, short, or too long", async () => {
    expect((await GET(request())).status).toBe(400);
    expect((await GET(request("a"))).status).toBe(400);
    expect((await GET(request("a".repeat(65)))).status).toBe(400);
  });

  it("returns 500 when GOCENTRAL_API_BASE_URL is unset", async () => {
    delete process.env.GOCENTRAL_API_BASE_URL;
    const response = await GET(request("el"));
    expect(response.status).toBe(500);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("proxies a successful search", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ users: [user] }), { status: 200 }),
    );

    const response = await GET(request("el"));
    expect(await response.json()).toEqual({ users: [user] });
    const upstream = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(upstream.toString()).toBe(
      "http://gocentral.test/users/search?q=el",
    );
  });

  it("normalizes a missing users array", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const response = await GET(request("el"));
    expect(await response.json()).toEqual({ users: [] });
  });

  it("maps upstream failures to 400 or 502", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("bad", { status: 400 }),
    );
    expect((await GET(request("el"))).status).toBe(400);

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("boom", { status: 500 }),
    );
    expect((await GET(request("el"))).status).toBe(502);
  });
});
