import { NextResponse } from "next/server";
import { fetchBattles } from "@/lib/gocentral/battles";
import { GoCentralApiError } from "@/lib/gocentral/errors";

export async function GET() {
  try {
    const battles = await fetchBattles();
    return NextResponse.json({ battles });
  } catch (error) {
    if (error instanceof GoCentralApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unexpected battles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch battles" },
      { status: 502 },
    );
  }
}
