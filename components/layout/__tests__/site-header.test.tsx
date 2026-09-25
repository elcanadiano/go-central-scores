import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeader } from "@/components/layout/site-header";

const usePathname = jest.fn(() => "/");

jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("SiteHeader", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
  });

  it("renders brand and desktop navigation links", () => {
    render(<SiteHeader />);

    expect(
      screen.getByRole("link", { name: "GoCentralScores" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Song leaderboard" }),
    ).toHaveAttribute("href", "/leaderboards/song");
    expect(
      screen.getByRole("link", { name: "Battle leaderboard" }),
    ).toHaveAttribute("href", "/leaderboards/battle");
    expect(screen.getByRole("link", { name: "Role leaderboard" })).toHaveAttribute(
      "href",
      "/leaderboards/role-rank",
    );
    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute(
      "href",
      "/stats",
    );
  });

  it("marks the current page in desktop nav", () => {
    usePathname.mockReturnValue("/leaderboards/song");
    render(<SiteHeader />);

    expect(
      screen.getByRole("link", { name: "Song leaderboard" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("toggles the mobile menu", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();

    await user.click(openButton);

    expect(
      screen.getByRole("navigation", { name: "Mobile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close menu" }),
    ).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });

  it("closes the mobile menu on Escape", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      screen.getByRole("navigation", { name: "Mobile" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });
});
