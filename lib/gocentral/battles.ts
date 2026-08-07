import type { BattleInfo, BattlesResponse } from "@/lib/gocentral/types";
import { GoCentralApiError } from "@/lib/gocentral/errors";

export async function fetchBattles(): Promise<BattleInfo[]> {
  const baseUrl = process.env.GOCENTRAL_API_BASE_URL;
  if (!baseUrl) {
    throw new GoCentralApiError("GOCENTRAL_API_BASE_URL is not configured", 500);
  }

  const upstream = new URL("/battles", baseUrl);

  let response: Response;
  try {
    response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    console.error("GoCentral battles request failed:", error);
    throw new GoCentralApiError("Failed to reach GoCentral API", 502);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("GoCentral battles error:", response.status, body);
    throw new GoCentralApiError(
      "Failed to fetch battles",
      response.status === 400 ? 400 : 502,
    );
  }

  const data = (await response.json()) as BattlesResponse;
  return data.battles ?? [];
}
