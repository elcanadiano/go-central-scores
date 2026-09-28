"use client";

import { useRef } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { BattleLeaderboardEntry } from "@/lib/gocentral/types";

const ROW_HEIGHT = 44;

type BattleLeaderboardTableProps = {
  entries: BattleLeaderboardEntry[];
};

export function BattleLeaderboardTable({
  entries,
}: BattleLeaderboardTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No scores for this battle.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div
        className="grid grid-cols-[4rem_minmax(0,1.4fr)_6.5rem] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
        role="row"
      >
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Score</span>
      </div>
      <div
        ref={parentRef}
        className="max-h-[min(70vh,36rem)] overflow-auto"
        role="rowgroup"
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const entry = entries[virtualRow.index];
            return (
              <Link
                key={entry.pid + "-" + entry.rank}
                href={`/role-ranks?pid=${entry.pid}`}
                className="absolute left-0 grid w-full grid-cols-[4rem_minmax(0,1.4fr)_6.5rem] gap-2 border-b border-border/60 px-3 text-sm text-foreground no-underline transition-colors outline-none last:border-b-0 hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-inset"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <span className="flex items-center tabular-nums text-muted-foreground">
                  {entry.rank}
                </span>
                <span className="flex items-center truncate font-medium">
                  {entry.name}
                </span>
                <span className="flex items-center justify-end tabular-nums">
                  {entry.score.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
