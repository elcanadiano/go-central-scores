import { Suspense } from "react";
import type { Metadata } from "next";
import { MyRankingsPage } from "@/components/leaderboards/my-rankings-page";

export const metadata: Metadata = {
  title: "My rankings",
  description: "Look up a player's career role rankings.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <MyRankingsPage />
    </Suspense>
  );
}
