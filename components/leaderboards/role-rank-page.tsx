"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RoleRankTable } from "@/components/leaderboards/role-rank-table";
import { RoleSelect } from "@/components/leaderboards/role-select";
import {
  DEFAULT_ROLE_ID,
  isRoleId,
  type RoleId,
} from "@/lib/gocentral/roles";
import type { RoleRankEntry } from "@/lib/gocentral/types";

const PAGE_SIZE = 20;

type LeaderboardApiResponse = {
  leaderboard: RoleRankEntry[] | null;
  page: number;
  page_size: number;
  error?: string;
};

function loadKey(roleId: RoleId, pid: number | null): string {
  return `${roleId}:${pid ?? ""}`;
}

export function RoleRankPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const lastLoadedKeyRef = useRef<string | null>(null);
  const defaultsSyncedRef = useRef(false);

  const roleParam = searchParams.get("role_id");
  const urlRoleRaw = roleParam == null ? Number.NaN : Number(roleParam);
  const urlRoleId = isRoleId(urlRoleRaw) ? urlRoleRaw : DEFAULT_ROLE_ID;
  const rb3Param = searchParams.get("rb3_only");
  const urlRb3Only = rb3Param === "1";
  const pidParam = searchParams.get("pid");
  const urlPidRaw = pidParam == null ? Number.NaN : Number(pidParam);
  const urlPid = Number.isInteger(urlPidRaw) ? urlPidRaw : null;

  const [roleId, setRoleId] = useState<RoleId>(urlRoleId);
  const [rb3Only, setRb3Only] = useState(urlRb3Only);
  const [totalEntries, setTotalEntries] = useState<RoleRankEntry[]>([]);
  const [rb3Entries, setRb3Entries] = useState<RoleRankEntry[]>([]);
  const [earliestTotalPage, setEarliestTotalPage] = useState(1);
  const [earliestRb3Page, setEarliestRb3Page] = useState(1);
  const [latestTotalPage, setLatestTotalPage] = useState(1);
  const [latestRb3Page, setLatestRb3Page] = useState(1);
  const [totalHasMore, setTotalHasMore] = useState(false);
  const [rb3HasMore, setRb3HasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const totalLoadedRef = useRef(false);
  const rb3LoadedRef = useRef(false);
  const totalInflightRef = useRef(false);
  const rb3InflightRef = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncUrl = useCallback(
    (nextRoleId: RoleId, nextRb3Only: boolean, pid: number | null) => {
      const params = new URLSearchParams();
      params.set("role_id", String(nextRoleId));
      params.set("rb3_only", nextRb3Only ? "1" : "0");
      if (pid != null) {
        params.set("pid", String(pid));
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, startTransition],
  );

  const fetchPage = useCallback(
    async (
      nextRoleId: RoleId,
      nextRb3Only: boolean,
      page: number,
      pid: number | null,
    ) => {
      const params = new URLSearchParams({
        role_id: String(nextRoleId),
        rb3_only: nextRb3Only ? "1" : "0",
      });
      if (pid != null) {
        params.set("pid", String(pid));
      } else {
        params.set("page", String(page));
      }
      const response = await fetch(
        `/api/leaderboards/role-rank?${params.toString()}`,
      );
      const data = (await response.json()) as LeaderboardApiResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load leaderboard");
      }
      return data;
    },
    [],
  );

  const clearBoards = useCallback(() => {
    totalLoadedRef.current = false;
    rb3LoadedRef.current = false;
    totalInflightRef.current = false;
    rb3InflightRef.current = false;
    setTotalEntries([]);
    setRb3Entries([]);
    setEarliestTotalPage(1);
    setEarliestRb3Page(1);
    setLatestTotalPage(1);
    setLatestRb3Page(1);
    setTotalHasMore(false);
    setRb3HasMore(false);
  }, []);

  const loadBoard = useCallback(
    async (nextRoleId: RoleId, nextRb3Only: boolean, pid: number | null) => {
      const loadedRef = nextRb3Only ? rb3LoadedRef : totalLoadedRef;
      const inflightRef = nextRb3Only ? rb3InflightRef : totalInflightRef;
      if (loadedRef.current || inflightRef.current) {
        return;
      }
      inflightRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPage(nextRoleId, nextRb3Only, 1, pid);
        const pageEntries = data.leaderboard ?? [];
        const page = pageEntries.length > 0 ? data.page : 1;
        if (nextRb3Only) {
          rb3LoadedRef.current = true;
          setRb3Entries(pageEntries);
          setEarliestRb3Page(page);
          setLatestRb3Page(page);
          setRb3HasMore(pageEntries.length === PAGE_SIZE);
        } else {
          totalLoadedRef.current = true;
          setTotalEntries(pageEntries);
          setEarliestTotalPage(page);
          setLatestTotalPage(page);
          setTotalHasMore(pageEntries.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load scores");
      } finally {
        inflightRef.current = false;
        setLoading(false);
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    if (
      (roleParam == null || rb3Param == null) &&
      !defaultsSyncedRef.current
    ) {
      defaultsSyncedRef.current = true;
      syncUrl(urlRoleId, urlRb3Only, urlPid);
    }

    const key = loadKey(urlRoleId, urlPid);
    if (lastLoadedKeyRef.current !== key) {
      lastLoadedKeyRef.current = key;
      clearBoards();
      setRoleId(urlRoleId);
      setRb3Only(urlRb3Only);
      void loadBoard(urlRoleId, urlRb3Only, urlPid);
      return;
    }

    void loadBoard(urlRoleId, urlRb3Only, urlPid);
  }, [
    roleParam,
    rb3Param,
    urlRoleId,
    urlRb3Only,
    urlPid,
    loadBoard,
    clearBoards,
    syncUrl,
  ]);

  const entries = rb3Only ? rb3Entries : totalEntries;
  const earliestPage = rb3Only ? earliestRb3Page : earliestTotalPage;
  const latestPage = rb3Only ? latestRb3Page : latestTotalPage;
  const hasMore = rb3Only ? rb3HasMore : totalHasMore;
  const activeLoaded = rb3Only ? rb3LoadedRef.current : totalLoadedRef.current;

  async function handleLoadMore() {
    if (!hasMore || loadingMore || loadingPrevious) return;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = latestPage + 1;
      const data = await fetchPage(roleId, rb3Only, nextPage, null);
      const pageEntries = data.leaderboard;
      if (!pageEntries || pageEntries.length === 0) {
        if (rb3Only) setRb3HasMore(false);
        else setTotalHasMore(false);
        return;
      }
      if (rb3Only) {
        setRb3Entries((prev) => [...prev, ...pageEntries]);
        setLatestRb3Page(nextPage);
        setRb3HasMore(pageEntries.length === PAGE_SIZE);
      } else {
        setTotalEntries((prev) => [...prev, ...pageEntries]);
        setLatestTotalPage(nextPage);
        setTotalHasMore(pageEntries.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleLoadPrevious() {
    if (earliestPage <= 1 || loadingPrevious || loadingMore) return;
    setLoadingPrevious(true);
    setError(null);
    try {
      const previousPage = earliestPage - 1;
      const data = await fetchPage(roleId, rb3Only, previousPage, null);
      const pageEntries = data.leaderboard;
      if (!pageEntries || pageEntries.length === 0) {
        if (rb3Only) setEarliestRb3Page(1);
        else setEarliestTotalPage(1);
        return;
      }
      if (rb3Only) {
        setRb3Entries((prev) => [...pageEntries, ...prev]);
        setEarliestRb3Page(previousPage);
      } else {
        setTotalEntries((prev) => [...pageEntries, ...prev]);
        setEarliestTotalPage(previousPage);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load previous");
    } finally {
      setLoadingPrevious(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Leaderboards</p>
        <h1 className="text-3xl font-semibold tracking-tight">Role rank</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Search by instrument for the top ranked players. Toggle between total
          scores and Rock Band 3 scores.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <RoleSelect
          value={roleId}
          onChange={(nextRoleId) => {
            setRoleId(nextRoleId);
            syncUrl(nextRoleId, rb3Only, urlPid);
            lastLoadedKeyRef.current = loadKey(nextRoleId, urlPid);
            clearBoards();
            void loadBoard(nextRoleId, rb3Only, urlPid);
          }}
        />
        <label className="flex h-9 items-center gap-2 text-sm">
          <Switch
            checked={rb3Only}
            onCheckedChange={(checked) => {
              setRb3Only(checked);
              syncUrl(roleId, checked, urlPid);
              void loadBoard(roleId, checked, urlPid);
            }}
          />
          On-disc RB3 songs only
        </label>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !activeLoaded ? (
        <p className="text-sm text-muted-foreground">Loading scores…</p>
      ) : (
        <div className="space-y-4">
          <RoleRankTable entries={entries} />
          <div className="flex flex-wrap gap-3">
            {earliestPage > 1 ? (
              <Button
                type="button"
                variant="outline"
                disabled={loadingPrevious}
                onClick={() => void handleLoadPrevious()}
              >
                {loadingPrevious ? "Loading…" : "Load previous scores"}
              </Button>
            ) : null}
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
          </div>
          {entries.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Showing {entries.length} score
              {entries.length === 1 ? "" : "s"}
              {hasMore ? "" : " (end of leaderboard)"}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
