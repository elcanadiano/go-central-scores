import type { UserSearchResult } from "@/lib/gocentral/types";
import { GoCentralApiError } from "@/lib/gocentral/errors";

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const baseUrl = process.env.GOCENTRAL_API_BASE_URL;
  if (!baseUrl) {
    throw new GoCentralApiError("GOCENTRAL_API_BASE_URL is not configured", 500);
  }

  const upstream = new URL("/users/search", baseUrl);
  upstream.searchParams.set("q", query);

  let response: Response;
  try {
    response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    console.error("GoCentral user search request failed:", error);
    throw new GoCentralApiError("Failed to reach GoCentral API", 502);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("GoCentral user search error:", response.status, body);
    throw new GoCentralApiError(
      "Failed to search users",
      response.status === 400 ? 400 : 502,
    );
  }

  const data = (await response.json()) as { users?: UserSearchResult[] };
  return data.users ?? [];
}
