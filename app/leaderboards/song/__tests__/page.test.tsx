import { render, screen } from "@testing-library/react";
import Page, { metadata } from "@/app/leaderboards/song/page";

jest.mock("@/components/leaderboards/song-leaderboard-page", () => ({
  SongLeaderboardPage: () => <div>Song leaderboard content</div>,
}));

describe("app/leaderboards/song/page", () => {
  it("exports song leaderboard metadata", () => {
    expect(metadata).toEqual({
      title: "Song leaderboard",
      description: "Search songs and browse top scores by role.",
    });
  });

  it("renders the song leaderboard page inside Suspense", () => {
    render(<Page />);

    expect(screen.getByText("Song leaderboard content")).toBeInTheDocument();
  });
});
