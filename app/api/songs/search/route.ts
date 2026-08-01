import { NextResponse } from "next/server";
import { searchSongs } from "@/lib/songs/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const songs = await searchSongs(q);
    return NextResponse.json({ songs });
  } catch (error) {
    console.error("[api/songs/search] failed", { q, error });
    return NextResponse.json(
      { error: "Failed to search songs" },
      { status: 500 },
    );
  }
}
