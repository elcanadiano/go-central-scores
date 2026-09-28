import { NextResponse } from "next/server";
import { GoCentralApiError } from "@/lib/gocentral/errors";
import { searchUsers } from "@/lib/gocentral/users";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const length = [...q].length;

  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }
  if (length < 2) {
    return NextResponse.json(
      { error: "q must be at least 2 characters" },
      { status: 400 },
    );
  }
  if (length > 64) {
    return NextResponse.json(
      { error: "q must be at most 64 characters" },
      { status: 400 },
    );
  }

  try {
    const users = await searchUsers(q);
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof GoCentralApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unexpected user search error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 502 },
    );
  }
}
