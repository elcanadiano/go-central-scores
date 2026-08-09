import { NextResponse } from "next/server";
import { fetchStats } from "@/lib/gocentral/stats";
import { GoCentralApiError } from "@/lib/gocentral/errors";

export async function GET() {
  try {
    const stats = await fetchStats();
    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof GoCentralApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unexpected stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 502 },
    );
  }
}
