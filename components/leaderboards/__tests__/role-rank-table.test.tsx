import { render, screen } from "@testing-library/react";
import { RoleRankTable } from "@/components/leaderboards/role-rank-table";

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

const entry = {
  pid: 883100,
  name: "carol",
  total_score: 2488149,
  rank: 1,
};

describe("RoleRankTable", () => {
  it("shows an empty state when there are no entries", () => {
    render(<RoleRankTable entries={[]} rb3Only={false} />);

    expect(screen.getByText("No scores for this role.")).toBeInTheDocument();
  });

  it("renders rank, player, and total score", () => {
    const { rerender } = render(
      <RoleRankTable entries={[entry]} rb3Only={false} />,
    );

    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Total score")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /carol/ })).toHaveAttribute(
      "href",
      "/role-ranks?pid=883100&rb3_only=0",
    );
    expect(screen.getByText("2,488,149")).toBeInTheDocument();

    rerender(<RoleRankTable entries={[entry]} rb3Only />);
    expect(screen.getByRole("link", { name: /carol/ })).toHaveAttribute(
      "href",
      "/role-ranks?pid=883100&rb3_only=1",
    );
    expect(screen.queryByText("Stars")).not.toBeInTheDocument();
    expect(screen.queryByText("Accuracy")).not.toBeInTheDocument();
    expect(screen.queryByText("Diff")).not.toBeInTheDocument();
  });
});
