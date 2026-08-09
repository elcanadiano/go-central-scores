import { render, screen } from "@testing-library/react";
import Page, { metadata } from "@/app/stats/page";
import type { GoCentralStats } from "@/lib/gocentral/types";
import type { SongSearchResult } from "@/lib/songs/types";

jest.mock("@/lib/gocentral/stats", () => ({
  fetchStats: jest.fn(),
}));

jest.mock("@/lib/songs/lookup", () => ({
  getSongsByIds: jest.fn(),
}));

import { fetchStats } from "@/lib/gocentral/stats";
import { getSongsByIds } from "@/lib/songs/lookup";

const sampleStats: GoCentralStats = {
  scores: 2029743,
  machines: 375,
  setlists: 1922,
  characters: 9984,
  bands: 2067,
  active_gatherings: 7,
  most_popular_song_ids: [1083],
  most_popular_song_score_counts: [4667],
};

const sampleSongs: SongSearchResult[] = [
  {
    song_id_number: 1083,
    name: "The Middle",
    artist: "Jimmy Eat World",
    album: "Bleed American",
  },
];

describe("app/stats/page", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("exports stats metadata", () => {
    expect(metadata).toEqual({
      title: "Stats",
      description: "Live GoCentral ecosystem stats.",
    });
  });

  it("renders stats with enriched popular songs", async () => {
    (fetchStats as jest.Mock).mockResolvedValue(sampleStats);
    (getSongsByIds as jest.Mock).mockResolvedValue(sampleSongs);

    const ui = await Page();
    render(ui);

    expect(
      screen.getByText((_, element) =>
        element?.textContent === "There are 2,029,743 scores.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent ===
        "The Middle by Jimmy Eat World has 4,667 scores.",
      ),
    ).toBeInTheDocument();
    expect(getSongsByIds).toHaveBeenCalledWith([1083]);
  });

  it("shows an error when stats fetch fails", async () => {
    (fetchStats as jest.Mock).mockRejectedValue(
      new Error("GOCENTRAL_API_BASE_URL is not configured"),
    );

    const ui = await Page();
    render(ui);

    expect(screen.getByText("Failed to load stats")).toBeInTheDocument();
    expect(getSongsByIds).not.toHaveBeenCalled();
  });
});
