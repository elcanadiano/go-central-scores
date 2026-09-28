"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { UserSearch } from "@/components/leaderboards/user-search";
import { roleLabel } from "@/lib/gocentral/roles";
import type {
  PlayerRoleRank,
  PlayerRoleRanksUser,
  UserSearchResult,
} from "@/lib/gocentral/types";

type RoleRanksApiResponse = {
  user: PlayerRoleRanksUser;
  rankings: PlayerRoleRank[];
  error?: string;
};

export function MyRankingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const lastLoadedPidRef = useRef<number | null>(null);

  const pidParam = searchParams.get("pid");
  const urlPidRaw = pidParam == null ? Number.NaN : Number(pidParam);
  const urlPid = Number.isInteger(urlPidRaw) ? urlPidRaw : null;
  const urlRb3Only = searchParams.get("rb3_only") === "1";

  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const [rb3Only, setRb3Only] = useState(urlRb3Only);
  const [rankings, setRankings] = useState<PlayerRoleRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncUrl = useCallback(
    (pid: number | null, nextRb3Only: boolean) => {
      const params = new URLSearchParams();
      if (pid != null) {
        params.set("pid", String(pid));
      }
      params.set("rb3_only", nextRb3Only ? "1" : "0");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, startTransition],
  );

  const loadRanks = useCallback(async (pid: number) => {
    lastLoadedPidRef.current = pid;
    setLoading(true);
    setError(null);
    setRankings([]);
    try {
      const response = await fetch(`/api/role-ranks?pid=${pid}`);
      const data = (await response.json()) as RoleRanksApiResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load rankings");
      }
      setSelectedUser(data.user);
      setRankings(data.rankings ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load rankings");
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRb3Only(urlRb3Only);
    if (urlPid == null) {
      return;
    }
    if (lastLoadedPidRef.current === urlPid) {
      return;
    }
    void loadRanks(urlPid);
  }, [urlPid, urlRb3Only, loadRanks]);

  const visibleRankings = rb3Only
    ? rankings.filter((row) => !(row.rb3_score === 0 && row.rb3_rank === 0))
    : rankings;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Leaderboards</p>
        <h1 className="text-3xl font-semibold tracking-tight">My rankings</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Search for a player by name to see their career rank on each role.
          Turn on on-disc Rock Band 3 songs to show that board instead.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <UserSearch
          selected={selectedUser}
          onSelect={(user) => {
            setSelectedUser(user);
            syncUrl(user.pid, rb3Only);
            void loadRanks(user.pid);
          }}
        />
        <label className="flex h-9 items-center gap-2 text-sm">
          <Switch
            checked={rb3Only}
            onCheckedChange={(checked) => {
              setRb3Only(checked);
              syncUrl(selectedUser?.pid ?? urlPid, checked);
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

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading rankings…</p>
      ) : selectedUser ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Showing all rankings for{" "}
            <span className="font-semibold text-foreground">
              {selectedUser.username}
            </span>
            .
          </p>
          {visibleRankings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rankings for this player.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[minmax(0,1.4fr)_8rem_5rem] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <span>Role</span>
                <span className="text-right">Score</span>
                <span className="text-right">Rank</span>
              </div>
              {visibleRankings.map((row) => {
                const score = rb3Only ? row.rb3_score : row.total_score;
                const rank = rb3Only ? row.rb3_rank : row.total_rank;
                return (
                  <div
                    key={row.role_id}
                    className="grid grid-cols-[minmax(0,1.4fr)_8rem_5rem] gap-2 border-b border-border/60 px-3 py-2 text-sm last:border-b-0"
                  >
                    <span className="font-medium">{roleLabel(row.role_id)}</span>
                    <span className="text-right tabular-nums">
                      {score.toLocaleString()}
                    </span>
                    <span className="text-right tabular-nums">{rank}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Search for a player to see their rankings.
        </p>
      )}
    </div>
  );
}
