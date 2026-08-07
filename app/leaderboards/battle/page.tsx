import { Suspense } from "react";
import type { Metadata } from "next";
import { BattleLeaderboardPage } from "@/components/leaderboards/battle-leaderboard-page";
import { fetchBattles } from "@/lib/gocentral/battles";
import { GoCentralApiError } from "@/lib/gocentral/errors";
import type { BattleInfo } from "@/lib/gocentral/types";

export const metadata: Metadata = {
  title: "Battle leaderboard",
  description: "Browse battle leaderboards from GoCentral.",
};

export default async function Page() {
  let battles: BattleInfo[] = [];
  try {
    battles = await fetchBattles();
  } catch (error) {
    if (!(error instanceof GoCentralApiError)) {
      console.error(error);
    } else {
      console.error("Failed to load battles:", error.message);
    }
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <BattleLeaderboardPage battles={battles} />
    </Suspense>
  );
}
