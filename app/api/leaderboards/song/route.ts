import { NextResponse } from "next/server";
import type { LeaderboardResponse } from "@/lib/gocentral/types";
import { isRoleId } from "@/lib/gocentral/roles";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const songId = searchParams.get("song_id");
  const roleIdRaw = searchParams.get("role_id");
  const pageRaw = searchParams.get("page") ?? "1";

  if (!songId || !roleIdRaw) {
    return NextResponse.json(
      { error: "song_id and role_id are required" },
      { status: 400 },
    );
  }

  const songIdNumber = Number(songId);
  const roleId = Number(roleIdRaw);
  const page = Number(pageRaw);

  if (!Number.isInteger(songIdNumber)) {
    return NextResponse.json({ error: "Invalid song_id" }, { status: 400 });
  }
  if (!isRoleId(roleId)) {
    return NextResponse.json({ error: "Invalid role_id" }, { status: 400 });
  }
  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const baseUrl = process.env.GOCENTRAL_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "GOCENTRAL_API_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  const upstream = new URL("/leaderboards/song", baseUrl);
  upstream.searchParams.set("song_id", String(songIdNumber));
  upstream.searchParams.set("role_id", String(roleId));
  upstream.searchParams.set("page", String(page));
  upstream.searchParams.set("page_size", String(PAGE_SIZE));

  try {
    const response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("GoCentral leaderboard error:", response.status, body);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: response.status === 400 ? 400 : 502 },
      );
    }

    const data = (await response.json()) as LeaderboardResponse;
    return NextResponse.json({
      leaderboard: data.leaderboard ?? null,
      page,
      page_size: PAGE_SIZE,
    });
  } catch (error) {
    console.error("GoCentral leaderboard request failed:", error);
    return NextResponse.json(
      { error: "Failed to reach GoCentral API" },
      { status: 502 },
    );
  }
}
