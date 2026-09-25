import { Suspense } from "react";
import type { Metadata } from "next";
import { RoleRankPage } from "@/components/leaderboards/role-rank-page";

export const metadata: Metadata = {
  title: "Role rank",
  description: "Browse career role-rank totals from GoCentral.",
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
      <RoleRankPage />
    </Suspense>
  );
}
