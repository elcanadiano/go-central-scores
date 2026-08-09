import { render, screen } from "@testing-library/react";
import { StatsPage } from "@/components/stats/stats-page";
import type { GoCentralStats } from "@/lib/gocentral/types";
import type { SongSearchResult } from "@/lib/songs/types";

const sampleStats: GoCentralStats = {
  scores: 2029743,
  machines: 375,
  setlists: 1922,
  characters: 9984,
  bands: 2067,
  active_gatherings: 7,
  most_popular_song_ids: [1083, 1064],
  most_popular_song_score_counts: [4667, 4594],
};

const sampleSongs: SongSearchResult[] = [
  {
    song_id_number: 1083,
    name: "The Middle",
    artist: "Jimmy Eat World",
    album: "Bleed American",
  },
];

describe("StatsPage", () => {
  it("renders prose stat sentences", () => {
    render(<StatsPage stats={sampleStats} songs={[]} error={null} />);

    expect(
      screen.getByText((_, element) =>
        element?.textContent === "There are 2,029,743 scores.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent ===
        "There have been 375 machines that have connected to GoCentral.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === "There has been 1,922 setlists created.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === "There has been 9,984 characters registered.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === "There are 2,067 bands.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === "There are 7 active gatherings.",
      ),
    ).toBeInTheDocument();
  });

  it("renders enriched popular song lines with leaderboard links", () => {
    render(<StatsPage stats={sampleStats} songs={sampleSongs} error={null} />);

    const middleLink = screen.getByRole("link", { name: "The Middle" });
    expect(middleLink).toHaveAttribute(
      "href",
      "/leaderboards/song?song_id=1083",
    );
    expect(
      screen.getByText((_, element) =>
        element?.textContent ===
        "The Middle by Jimmy Eat World has 4,667 scores.",
      ),
    ).toBeInTheDocument();

    const fallbackLink = screen.getByRole("link", { name: "#1064" });
    expect(fallbackLink).toHaveAttribute(
      "href",
      "/leaderboards/song?song_id=1064",
    );
    expect(
      screen.getByText((_, element) =>
        element?.textContent === "#1064 has 4,594 scores.",
      ),
    ).toBeInTheDocument();
  });

  it("shows an error and hides stats when loading failed", () => {
    render(
      <StatsPage
        stats={null}
        songs={[]}
        error="GOCENTRAL_API_BASE_URL is not configured"
      />,
    );

    expect(
      screen.getByText("GOCENTRAL_API_BASE_URL is not configured"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/There are .* scores\./)).not.toBeInTheDocument();
  });

  it("hides the popular songs section when there are no ids", () => {
    render(
      <StatsPage
        stats={{ ...sampleStats, most_popular_song_ids: [] }}
        songs={[]}
        error={null}
      />,
    );

    expect(screen.queryByText("Most popular songs")).not.toBeInTheDocument();
  });
});
