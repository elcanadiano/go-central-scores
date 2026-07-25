import { render, screen } from "@testing-library/react";
import { LeaderboardTable } from "@/components/leaderboards/leaderboard-table";
import { makeEntries, sampleEntry } from "@/components/leaderboards/test-utils/fixtures";

jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 44,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 44,
        size: 44,
        end: (index + 1) * 44,
      })),
  }),
}));

describe("LeaderboardTable", () => {
  it("shows an empty state when there are no entries", () => {
    render(<LeaderboardTable entries={[]} />);

    expect(
      screen.getByText("No scores for this song and role."),
    ).toBeInTheDocument();
  });

  it("renders formatted score rows", () => {
    render(<LeaderboardTable entries={[sampleEntry]} />);

    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("Unnamed Band")).toBeInTheDocument();
    expect(screen.getByText("2,488,149")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Expert+")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders multiple rows", () => {
    render(<LeaderboardTable entries={makeEntries(3)} />);

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
  });
});
