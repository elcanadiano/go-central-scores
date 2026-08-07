"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BattleLeaderboardTable } from "@/components/leaderboards/battle-leaderboard-table";
import { BattleSelect } from "@/components/leaderboards/battle-select";
import { RoleSelect } from "@/components/leaderboards/role-select";
import {
  DEFAULT_ROLE_ID,
  isRoleId,
  type RoleId,
} from "@/lib/gocentral/roles";
import type {
  BattleInfo,
  BattleLeaderboardEntry,
} from "@/lib/gocentral/types";

const PAGE_SIZE = 20;

type LeaderboardApiResponse = {
  leaderboard: BattleLeaderboardEntry[] | null;
  page: number;
  page_size: number;
  error?: string;
};

function roleFromInstrument(instrument: number): RoleId {
  return isRoleId(instrument) ? instrument : DEFAULT_ROLE_ID;
}

type BattleLeaderboardPageProps = {
  battles: BattleInfo[];
};

export function BattleLeaderboardPage({ battles }: BattleLeaderboardPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const lastLoadedBattleIdRef = useRef<number | null>(null);

  const battleParam = searchParams.get("battle_id");
  const urlBattleId =
    battleParam == null ? Number.NaN : Number(battleParam);

  const [selectedBattle, setSelectedBattle] = useState<BattleInfo | null>(
    null,
  );
  const [roleId, setRoleId] = useState<RoleId>(DEFAULT_ROLE_ID);
  const [entries, setEntries] = useState<BattleLeaderboardEntry[]>([]);
  const [loadedPages, setLoadedPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncUrl = useCallback(
    (battleId: number | null) => {
      const params = new URLSearchParams();
      if (battleId != null) {
        params.set("battle_id", String(battleId));
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, startTransition],
  );

  const fetchPage = useCallback(async (battleId: number, page: number) => {
    const response = await fetch(
      `/api/leaderboards/battle?battle_id=${battleId}&page=${page}`,
    );
    const data = (await response.json()) as LeaderboardApiResponse;
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load leaderboard");
    }
    return data;
  }, []);

  const loadInitial = useCallback(
    async (battle: BattleInfo) => {
      lastLoadedBattleIdRef.current = battle.battle_id;
      setLoading(true);
      setError(null);
      setEntries([]);
      setLoadedPages(0);
      setHasMore(false);
      try {
        const data = await fetchPage(battle.battle_id, 1);
        const pageEntries = data.leaderboard ?? [];
        setEntries(pageEntries);
        setLoadedPages(pageEntries.length > 0 ? 1 : 0);
        setHasMore(pageEntries.length === PAGE_SIZE);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load scores");
        setEntries([]);
        setLoadedPages(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage],
  );

  const selectBattle = useCallback(
    (battle: BattleInfo, updateUrl: boolean) => {
      setSelectedBattle(battle);
      setRoleId(roleFromInstrument(battle.instrument));
      if (updateUrl) {
        syncUrl(battle.battle_id);
      }
      void loadInitial(battle);
    },
    [loadInitial, syncUrl],
  );

  // Hydrate battle + scores from URL
  useEffect(() => {
    if (!Number.isInteger(urlBattleId)) {
      return;
    }

    if (lastLoadedBattleIdRef.current === urlBattleId) {
      return;
    }

    const battle = battles.find((b) => b.battle_id === urlBattleId);
    if (!battle) {
      return;
    }

    selectBattle(battle, false);
  }, [urlBattleId, battles, selectBattle]);

  async function handleLoadMore() {
    if (!selectedBattle || !hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = loadedPages + 1;
      const data = await fetchPage(selectedBattle.battle_id, nextPage);
      const pageEntries = data.leaderboard;
      if (!pageEntries || pageEntries.length === 0) {
        setHasMore(false);
        return;
      }
      setEntries((prev) => [...prev, ...pageEntries]);
      setLoadedPages(nextPage);
      setHasMore(pageEntries.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Leaderboards</p>
        <h1 className="text-3xl font-semibold tracking-tight">Battle scores</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pick a battle from the list to browse its top scores. The role is
          fixed by the battle&apos;s instrument. Use Load more to append the
          next page of results.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <BattleSelect
          battles={battles}
          value={selectedBattle?.battle_id ?? null}
          onChange={(battle) => {
            selectBattle(battle, true);
          }}
        />
        <RoleSelect value={roleId} onChange={() => {}} disabled />
      </div>

      {selectedBattle ? (
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {selectedBattle.title}
            <span className="font-normal text-muted-foreground">
              {" "}
              · #{selectedBattle.battle_id}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {battles.length === 0
            ? "No battles are available right now."
            : "Select a battle to load its leaderboard."}
        </p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading scores…</p>
      ) : selectedBattle ? (
        <div className="space-y-4">
          <BattleLeaderboardTable entries={entries} />
          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              disabled={loadingMore}
              onClick={() => void handleLoadMore()}
            >
              {loadingMore ? "Loading…" : "Load more scores"}
            </Button>
          ) : null}
          {entries.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Showing {entries.length} score
              {entries.length === 1 ? "" : "s"}
              {hasMore ? "" : " (end of leaderboard)"}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
