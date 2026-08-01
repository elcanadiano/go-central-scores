"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { isSongIdQuery } from "@/lib/songs/song-id";
import type { SongSearchResult } from "@/lib/songs/types";
import { cn } from "@/lib/utils";

type SongSearchProps = {
  selected: SongSearchResult | null;
  onSelect: (song: SongSearchResult) => void;
};

function formatSongLabel(song: SongSearchResult): string {
  const name = song.name ?? "Unknown song";
  const artist = song.artist ?? "Unknown artist";
  const album = song.album ? ` (${song.album})` : "";
  return `${name} — ${artist}${album}`;
}

export function SongSearch({ selected, onSelect }: SongSearchProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(() =>
    selected ? formatSongLabel(selected) : "",
  );
  const [results, setResults] = useState<SongSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLabel = selected ? formatSongLabel(selected) : null;
  const isShowingSelection = selectedLabel != null && query === selectedLabel;

  const trimmed = query.trim();
  const songIdQuery = isSongIdQuery(trimmed);
  const canSearch =
    !isShowingSelection &&
    (songIdQuery ? trimmed.length >= 1 : trimmed.length >= 2);

  // Keep the field in sync when the parent selection changes (e.g. URL hydrate).
  useEffect(() => {
    setQuery(selected ? formatSongLabel(selected) : "");
    setResults([]);
    setOpen(false);
    setError(null);
  }, [selected?.song_id_number]);

  useEffect(() => {
    if (!canSearch) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/songs/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Search failed");
        }
        const data = (await response.json()) as { songs: SongSearchResult[] };
        setResults(data.songs);
        setOpen(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        setError("Could not search songs");
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [canSearch, trimmed]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const visibleResults = canSearch ? results : [];

  function beginEditing() {
    if (isShowingSelection) {
      setQuery("");
      setResults([]);
      setOpen(false);
      setError(null);
    } else if (visibleResults.length > 0) {
      setOpen(true);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Song
      </label>
      <Input
        value={query}
        role="combobox"
        aria-expanded={open && visibleResults.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search by name, artist, album, or song ID"
        onValueChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onFocus={beginEditing}
        onClick={beginEditing}
      />
      {loading ? (
        <p className="mt-1.5 text-xs text-muted-foreground">Searching…</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : null}
      {open && canSearch && !loading && !error && visibleResults.length === 0 ? (
        <p className="mt-1.5 text-xs text-muted-foreground">No songs found</p>
      ) : null}
      {open && visibleResults.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-3xl bg-popover p-1.5 shadow-lg ring-1 ring-foreground/5"
        >
          {visibleResults.map((song) => {
            const isSelected =
              selected?.song_id_number === song.song_id_number;
            return (
              <li
                key={song.song_id_number}
                role="option"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onSelect(song);
                    setQuery(formatSongLabel(song));
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">
                    {song.name ?? "Unknown song"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {song.artist ?? "Unknown artist"}
                    {song.album ? ` · ${song.album}` : ""} · #
                    {song.song_id_number}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
