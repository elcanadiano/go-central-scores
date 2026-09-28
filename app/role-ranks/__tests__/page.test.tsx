import { render, screen } from "@testing-library/react";
import Page, { metadata } from "@/app/role-ranks/page";

jest.mock("@/components/leaderboards/my-rankings-page", () => ({
  MyRankingsPage: () => <div>My rankings content</div>,
}));

describe("app/role-ranks/page", () => {
  it("exports my rankings metadata", () => {
    expect(metadata).toEqual({
      title: "My rankings",
      description: "Look up a player's career role rankings.",
    });
  });

  it("renders the page inside Suspense", () => {
    render(<Page />);
    expect(screen.getByText("My rankings content")).toBeInTheDocument();
  });
});