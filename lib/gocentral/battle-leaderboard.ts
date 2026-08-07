import type {
  BattleLeaderboardEntry,
  BattleLeaderboardResponse,
} from "@/lib/gocentral/types";
import { GoCentralApiError } from "@/lib/gocentral/errors";

const PAGE_SIZE = 20;

export type BattleLeaderboardPage = {
  leaderboard: BattleLeaderboardEntry[] | null;
  page: number;
  page_size: number;
};

export async function fetchBattleLeaderboard(
  battleId: number,
  page: number,
): Promise<BattleLeaderboardPage> {
  const baseUrl = process.env.GOCENTRAL_API_BASE_URL;
  if (!baseUrl) {
    throw new GoCentralApiError("GOCENTRAL_API_BASE_URL is not configured", 500);
  }

  const upstream = new URL("/leaderboards/battle", baseUrl);
  upstream.searchParams.set("battle_id", String(battleId));
  upstream.searchParams.set("page", String(page));
  upstream.searchParams.set("page_size", String(PAGE_SIZE));

  let response: Response;
  try {
    response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    console.error("GoCentral battle leaderboard request failed:", error);
    throw new GoCentralApiError("Failed to reach GoCentral API", 502);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("GoCentral battle leaderboard error:", response.status, body);
    throw new GoCentralApiError(
      "Failed to fetch leaderboard",
      response.status === 400 ? 400 : 502,
    );
  }

  const data = (await response.json()) as BattleLeaderboardResponse;
  return {
    leaderboard: data.leaderboard ?? null,
    page,
    page_size: PAGE_SIZE,
  };
}
