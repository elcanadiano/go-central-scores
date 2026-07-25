"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LeaderboardTable } from "@/components/leaderboards/leaderboard-table";
import { RoleSelect } from "@/components/leaderboards/role-select";
import { SongSearch } from "@/components/leaderboards/song-search";
import {
  DEFAULT_ROLE_ID,
  isRoleId,
  type RoleId,
} from "@/lib/gocentral/roles";
import type { LeaderboardEntry } from "@/lib/gocentral/types";
import type { SongSearchResult } from "@/lib/songs/types";

const PAGE_SIZE = 20;

type LeaderboardApiResponse = {
  leaderboard: LeaderboardEntry[] | null;
  page: number;
  page_size: number;
  error?: string;
};

function loadKey(songId: number, roleId: RoleId): string {
  return `${songId}:${roleId}`;
}

export function SongLeaderboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const lastLoadedKeyRef = useRef<string | null>(null);

  const songParam = searchParams.get("song_id");
  const roleParam = searchParams.get("role_id");
  const urlSongId = songParam == null ? Number.NaN : Number(songParam);
  const urlRoleRaw = roleParam == null ? Number.NaN : Number(roleParam);
  const urlRoleId = isRoleId(urlRoleRaw) ? urlRoleRaw : DEFAULT_ROLE_ID;

  const [selectedSong, setSelectedSong] = useState<SongSearchResult | null>(
    null,
  );
  const [roleId, setRoleId] = useState<RoleId>(urlRoleId);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loadedPages, setLoadedPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncUrl = useCallback(
    (songId: number | null, nextRoleId: RoleId) => {
      const params = new URLSearchParams();
      if (songId != null) {
        params.set("song_id", String(songId));
      }
      params.set("role_id", String(nextRoleId));
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, startTransition],
  );

  const fetchPage = useCallback(
    async (songId: number, nextRoleId: RoleId, page: number) => {
      const response = await fetch(
        `/api/leaderboards/song?song_id=${songId}&role_id=${nextRoleId}&page=${page}`,
      );
      const data = (await response.json()) as LeaderboardApiResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load leaderboard");
      }
      return data;
    },
    [],
  );

  const loadInitial = useCallback(
    async (song: SongSearchResult, nextRoleId: RoleId) => {
      lastLoadedKeyRef.current = loadKey(song.song_id_number, nextRoleId);
      setLoading(true);
      setError(null);
      setEntries([]);
      setLoadedPages(0);
      setHasMore(false);
      try {
        const data = await fetchPage(song.song_id_number, nextRoleId, 1);
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

  // Hydrate song + scores from URL (skip if UI already loaded this pair)
  useEffect(() => {
    if (!Number.isInteger(urlSongId) || urlSongId < 0) {
      return;
    }

    const key = loadKey(urlSongId, urlRoleId);
    if (lastLoadedKeyRef.current === key) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(
          `/api/songs/search?q=${encodeURIComponent(String(urlSongId))}`,
        );
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { songs: SongSearchResult[] };
        const song = data.songs[0];
        if (!song || cancelled) return;
        if (lastLoadedKeyRef.current === key) return;

        setSelectedSong(song);
        setRoleId(urlRoleId);
        await loadInitial(song, urlRoleId);
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [urlSongId, urlRoleId, loadInitial]);

  async function handleLoadMore() {
    if (!selectedSong || !hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = loadedPages + 1;
      const data = await fetchPage(
        selectedSong.song_id_number,
        roleId,
        nextPage,
      );
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
        <h1 className="text-3xl font-semibold tracking-tight">Song scores</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Search for a song, pick a role, and browse top scores. Use Load more
          to append the next page of results.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <SongSearch
          key={selectedSong?.song_id_number ?? "none"}
          selected={selectedSong}
          onSelect={(song) => {
            setSelectedSong(song);
            syncUrl(song.song_id_number, roleId);
            void loadInitial(song, roleId);
          }}
        />
        <RoleSelect
          value={roleId}
          onChange={(nextRoleId) => {
            setRoleId(nextRoleId);
            syncUrl(selectedSong?.song_id_number ?? null, nextRoleId);
            if (selectedSong) {
              void loadInitial(selectedSong, nextRoleId);
            }
          }}
        />
      </div>

      {selectedSong ? (
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {selectedSong.name ?? "Unknown song"}
            <span className="font-normal text-muted-foreground">
              {" "}
              · #{selectedSong.song_id_number}
            </span>
          </p>
          <p className="text-muted-foreground">
            {[selectedSong.artist, selectedSong.album]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a song to load its leaderboard.
        </p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading scores…</p>
      ) : selectedSong ? (
        <div className="space-y-4">
          <LeaderboardTable entries={entries} />
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
