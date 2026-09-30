import { render, screen } from "@testing-library/react";
import Page, { metadata } from "@/app/leaderboards/role-rank/page";

jest.mock("@/components/leaderboards/role-rank-page", () => ({
  RoleRankPage: () => <div>Role rank content</div>,
}));

describe("app/leaderboards/role-rank/page", () => {
  it("exports role rank metadata", () => {
    expect(metadata).toEqual({
      title: "Role rank",
      description: "Browse career role-rank totals from GoCentral.",
    });
  });

  it("renders the role rank page inside Suspense", () => {
    render(<Page />);

    expect(screen.getByText("Role rank content")).toBeInTheDocument();
  });
});