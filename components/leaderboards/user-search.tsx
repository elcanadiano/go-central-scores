"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import type { UserSearchResult } from "@/lib/gocentral/types";
import { cn } from "@/lib/utils";

type UserSearchProps = {
  selected: UserSearchResult | null;
  onSelect: (user: UserSearchResult) => void;
};

export function UserSearch({ selected, onSelect }: UserSearchProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(() => selected?.username ?? "");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isShowingSelection = selected != null && query === selected.username;
  const trimmed = query.trim();
  const canSearch = !isShowingSelection && trimmed.length >= 2;

  useEffect(() => {
    setQuery(selected?.username ?? "");
    setResults([]);
    setOpen(false);
    setError(null);
  }, [selected?.pid]);

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
          `/api/users/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Search failed");
        }
        const data = (await response.json()) as { users: UserSearchResult[] };
        setResults(data.users);
        setOpen(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        setError("Could not search players");
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
        Player
      </label>
      <Input
        value={query}
        role="combobox"
        aria-expanded={open && visibleResults.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search by name"
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
        <p className="mt-1.5 text-xs text-muted-foreground">No players found</p>
      ) : null}
      {open && visibleResults.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-3xl bg-popover p-1.5 shadow-lg ring-1 ring-foreground/5"
        >
          {visibleResults.map((user) => {
            const isSelected = selected?.pid === user.pid;
            return (
              <li key={user.pid} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onSelect(user);
                    setQuery(user.username);
                    setOpen(false);
                  }}
                >
                  {user.username}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
