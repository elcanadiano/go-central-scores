import { NextResponse } from "next/server";
import { GoCentralApiError } from "@/lib/gocentral/errors";
import { isRoleId } from "@/lib/gocentral/roles";
import { fetchRoleRankLeaderboard } from "@/lib/gocentral/role-rank";

function parseRb3Only(value: string | null): boolean | null {
  if (value == null || value === "0") return false;
  if (value === "1") return true;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roleIdRaw = searchParams.get("role_id");
  const pageRaw = searchParams.get("page") ?? "1";
  const rb3Only = parseRb3Only(searchParams.get("rb3_only"));
  const pidRaw = searchParams.get("pid");

  if (!roleIdRaw) {
    return NextResponse.json({ error: "role_id is required" }, { status: 400 });
  }

  const roleId = Number(roleIdRaw);
  const page = Number(pageRaw);

  if (!isRoleId(roleId)) {
    return NextResponse.json({ error: "Invalid role_id" }, { status: 400 });
  }
  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  if (rb3Only == null) {
    return NextResponse.json({ error: "Invalid rb3_only" }, { status: 400 });
  }

  let pid: number | undefined;
  if (pidRaw != null) {
    pid = Number(pidRaw);
    if (!Number.isInteger(pid)) {
      return NextResponse.json({ error: "Invalid pid" }, { status: 400 });
    }
  }

  try {
    const data = await fetchRoleRankLeaderboard(roleId, page, rb3Only, pid);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof GoCentralApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unexpected role rank error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 502 },
    );
  }
}
