"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RoleRankEntry } from "@/lib/gocentral/types";

const ROW_HEIGHT = 44;

type RoleRankTableProps = {
  entries: RoleRankEntry[];
};

export function RoleRankTable({ entries }: RoleRankTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No scores for this role.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div
        className="grid grid-cols-[4rem_minmax(0,1.4fr)_8rem] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
        role="row"
      >
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Total score</span>
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
              <div
                key={entry.pid + "-" + entry.rank}
                role="row"
                className="absolute left-0 grid w-full grid-cols-[4rem_minmax(0,1.4fr)_8rem] gap-2 border-b border-border/60 px-3 text-sm last:border-b-0"
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
                  {entry.total_score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
