import { NextResponse } from "next/server";
import { fetchBattleLeaderboard } from "@/lib/gocentral/battle-leaderboard";
import { GoCentralApiError } from "@/lib/gocentral/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const battleIdRaw = searchParams.get("battle_id");
  const pageRaw = searchParams.get("page") ?? "1";

  if (!battleIdRaw) {
    return NextResponse.json(
      { error: "battle_id is required" },
      { status: 400 },
    );
  }

  const battleId = Number(battleIdRaw);
  const page = Number(pageRaw);

  if (!Number.isInteger(battleId)) {
    return NextResponse.json({ error: "Invalid battle_id" }, { status: 400 });
  }
  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  try {
    const data = await fetchBattleLeaderboard(battleId, page);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof GoCentralApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unexpected battle leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 502 },
    );
  }
}
