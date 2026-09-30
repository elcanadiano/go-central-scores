import type { PlayerRoleRanks } from "@/lib/gocentral/types";
import { GoCentralApiError } from "@/lib/gocentral/errors";

export async function fetchPlayerRoleRanks(
  pid: number,
): Promise<PlayerRoleRanks> {
  const baseUrl = process.env.GOCENTRAL_API_BASE_URL;
  if (!baseUrl) {
    throw new GoCentralApiError("GOCENTRAL_API_BASE_URL is not configured", 500);
  }

  const upstream = new URL("/role-ranks", baseUrl);
  upstream.searchParams.set("pid", String(pid));

  let response: Response;
  try {
    response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    console.error("GoCentral role ranks request failed:", error);
    throw new GoCentralApiError("Failed to reach GoCentral API", 502);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("GoCentral role ranks error:", response.status, body);
    const status = response.status === 404 || response.status === 400 ? response.status : 502;
    throw new GoCentralApiError(
      status === 404 ? "User not found" : "Failed to fetch role ranks",
      status,
    );
  }

  const data = (await response.json()) as PlayerRoleRanks;
  return {
    user: data.user,
    rankings: data.rankings ?? [],
  };
}
