import { NextResponse } from "next/server";
import { getSongsByIds } from "@/lib/songs/lookup";

function parseSongIds(raw: string | null): number[] {
  if (raw == null || raw.trim() === "") {
    return [];
  }

  const ids: number[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (trimmed === "") {
      continue;
    }
    const value = Number(trimmed);
    if (!Number.isInteger(value)) {
      continue;
    }
    ids.push(value);
  }

  return ids;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = parseSongIds(searchParams.get("ids"));

  try {
    const songs = await getSongsByIds(ids);
    return NextResponse.json({ songs });
  } catch (error) {
    console.error("[api/songs/by-ids] failed", { ids, error });
    return NextResponse.json(
      { error: "Failed to look up songs" },
      { status: 500 },
    );
  }
}
