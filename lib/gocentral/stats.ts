import type { GoCentralStats } from "@/lib/gocentral/types";
import { GoCentralApiError } from "@/lib/gocentral/errors";

export async function fetchStats(): Promise<GoCentralStats> {
  const baseUrl = process.env.GOCENTRAL_API_BASE_URL;
  if (!baseUrl) {
    throw new GoCentralApiError("GOCENTRAL_API_BASE_URL is not configured", 500);
  }

  const upstream = new URL("/stats", baseUrl);

  let response: Response;
  try {
    response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    console.error("GoCentral stats request failed:", error);
    throw new GoCentralApiError("Failed to reach GoCentral API", 502);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("GoCentral stats error:", response.status, body);
    throw new GoCentralApiError(
      "Failed to fetch stats",
      response.status === 400 ? 400 : 502,
    );
  }

  const data = (await response.json()) as GoCentralStats;
  return {
    ...data,
    most_popular_song_ids: data.most_popular_song_ids ?? [],
    most_popular_song_score_counts: data.most_popular_song_score_counts ?? [],
  };
}
