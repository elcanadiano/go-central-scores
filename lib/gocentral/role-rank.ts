import type { RoleRankEntry, RoleRankResponse } from "@/lib/gocentral/types";
import { GoCentralApiError } from "@/lib/gocentral/errors";

export const ROLE_RANK_PAGE_SIZE = 20;

export type RoleRankLeaderboardPage = {
  leaderboard: RoleRankEntry[] | null;
  page: number;
  page_size: number;
};

export function pageFromRank(
  rank: number,
  pageSize = ROLE_RANK_PAGE_SIZE,
): number {
  if (!Number.isInteger(rank) || rank < 1) {
    return 1;
  }
  return Math.floor((rank - 1) / pageSize) + 1;
}

export async function fetchRoleRankLeaderboard(
  roleId: number,
  page: number,
  rb3Only: boolean,
  pid?: number,
): Promise<RoleRankLeaderboardPage> {
  const baseUrl = process.env.GOCENTRAL_API_BASE_URL;
  if (!baseUrl) {
    throw new GoCentralApiError("GOCENTRAL_API_BASE_URL is not configured", 500);
  }

  const upstream = new URL("/leaderboards/role-rank", baseUrl);
  upstream.searchParams.set("role_id", String(roleId));
  upstream.searchParams.set("page_size", String(ROLE_RANK_PAGE_SIZE));
  upstream.searchParams.set("rb3_only", rb3Only ? "1" : "0");
  if (pid != null) {
    upstream.searchParams.set("pid", String(pid));
  } else {
    upstream.searchParams.set("page", String(page));
  }

  let response: Response;
  try {
    response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    console.error("GoCentral role rank request failed:", error);
    throw new GoCentralApiError("Failed to reach GoCentral API", 502);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("GoCentral role rank error:", response.status, body);
    throw new GoCentralApiError(
      "Failed to fetch leaderboard",
      response.status === 400 ? 400 : 502,
    );
  }

  const data = (await response.json()) as RoleRankResponse;
  const leaderboard = data.leaderboard ?? null;
  const resolvedPage =
    pid != null
      ? leaderboard && leaderboard.length > 0
        ? pageFromRank(leaderboard[0].rank)
        : 1
      : page;

  return {
    leaderboard,
    page: resolvedPage,
    page_size: ROLE_RANK_PAGE_SIZE,
  };
}
