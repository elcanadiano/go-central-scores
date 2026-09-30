import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyRankingsPage } from "@/components/leaderboards/my-rankings-page";
import { jsonResponse } from "@/components/leaderboards/test-utils/fixtures";

if (typeof window.PointerEvent !== "function") {
  window.PointerEvent = class PointerEvent extends MouseEvent {} as typeof PointerEvent;
}

const replace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/role-ranks",
  useSearchParams: () => searchParams,
}));

const rankings = {
  user: { pid: 886100, username: "elcanadiano" },
  rankings: [
    {
      role_id: 2,
      total_score: 300,
      total_rank: 2,
      rb3_score: 100,
      rb3_rank: 4,
    },
    {
      role_id: 0,
      total_score: 50,
      total_rank: 8,
      rb3_score: 0,
      rb3_rank: 0,
    },
  ],
};

describe("MyRankingsPage", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    replace.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("prompts for a player when the page has no pid", () => {
    render(<MyRankingsPage />);
    expect(
      screen.getByText("Search for a player to see their rankings."),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("loads rankings after a player is selected", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        jsonResponse({
          users: [{ pid: 886100, username: "elcanadiano" }],
        }),
      )
      .mockResolvedValueOnce(jsonResponse(rankings));

    render(<MyRankingsPage />);
    await user.type(screen.getByPlaceholderText("Search by name"), "el");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await user.click(await screen.findByRole("button", { name: "elcanadiano" }));

    const summary = await screen.findByText(/Showing all rankings for/);
    expect(summary).toHaveTextContent("Showing all rankings for elcanadiano");
    expect(summary.querySelector("span")).toHaveClass("font-semibold");
    expect(await screen.findByRole("link", { name: /Guitar/ })).toHaveAttribute(
      "href",
      "/leaderboards/role-rank?role_id=2&rb3_only=0&pid=886100",
    );
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Drums/ })).toHaveAttribute(
      "href",
      "/leaderboards/role-rank?role_id=0&rb3_only=0&pid=886100",
    );
    expect(replace).toHaveBeenCalledWith(
      "/role-ranks?pid=886100&rb3_only=0",
      { scroll: false },
    );
  });

  it("hydrates from pid and toggles RB3 scores without another rankings request", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("pid=886100&rb3_only=0");
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(rankings));

    render(<MyRankingsPage />);
    expect(await screen.findByText("300")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Drums/ })).toHaveAttribute(
      "href",
      "/leaderboards/role-rank?role_id=0&rb3_only=0&pid=886100",
    );

    await user.click(
      screen.getByRole("switch", { name: "On-disc RB3 songs only" }),
    );

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Drums/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Guitar/ })).toHaveAttribute(
      "href",
      "/leaderboards/role-rank?role_id=2&rb3_only=1&pid=886100",
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toBe(
      "/api/role-ranks?pid=886100",
    );
  });

  it("shows an empty state and an error", async () => {
    searchParams = new URLSearchParams("pid=1");
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        user: { pid: 1, username: "empty" },
        rankings: [],
      }),
    );

    const { unmount } = render(<MyRankingsPage />);
    expect(
      await screen.findByText("No rankings for this player."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Showing all rankings for/)).toHaveTextContent(
      "Showing all rankings for empty",
    );
    unmount();

    searchParams = new URLSearchParams("pid=2");
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ error: "User not found" }, 404),
    );
    render(<MyRankingsPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("User not found");
  });
});
