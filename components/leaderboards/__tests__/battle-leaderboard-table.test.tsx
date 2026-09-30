import { render, screen } from "@testing-library/react";
import { BattleLeaderboardTable } from "@/components/leaderboards/battle-leaderboard-table";
import {
  makeBattleEntries,
  sampleBattleEntry,
} from "@/components/leaderboards/test-utils/fixtures";

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

describe("BattleLeaderboardTable", () => {
  it("shows an empty state when there are no entries", () => {
    render(<BattleLeaderboardTable entries={[]} />);

    expect(
      screen.getByText("No scores for this battle."),
    ).toBeInTheDocument();
  });

  it("renders slim score rows without stars or difficulty", () => {
    render(<BattleLeaderboardTable entries={[sampleBattleEntry]} />);

    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Battle Champ/ })).toHaveAttribute(
      "href",
      "/role-ranks?pid=3850",
    );
    expect(screen.getByText("50,000")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("Stars")).not.toBeInTheDocument();
    expect(screen.queryByText("Accuracy")).not.toBeInTheDocument();
    expect(screen.queryByText("Diff")).not.toBeInTheDocument();
  });

  it("renders multiple rows", () => {
    render(<BattleLeaderboardTable entries={makeBattleEntries(3)} />);

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
  });
});
