import { NextResponse } from "next/server";
import { GoCentralApiError } from "@/lib/gocentral/errors";
import { fetchPlayerRoleRanks } from "@/lib/gocentral/player-role-ranks";

export async function GET(request: Request) {
  const pidRaw = new URL(request.url).searchParams.get("pid");
  if (!pidRaw) {
    return NextResponse.json({ error: "pid is required" }, { status: 400 });
  }

  const pid = Number(pidRaw);
  if (!Number.isInteger(pid)) {
    return NextResponse.json({ error: "Invalid pid" }, { status: 400 });
  }

  try {
    const data = await fetchPlayerRoleRanks(pid);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof GoCentralApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unexpected role ranks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch role ranks" },
      { status: 502 },
    );
  }
}
