import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleLeaderboardPage } from "@/components/leaderboards/battle-leaderboard-page";
import {
  jsonResponse,
  makeBattleEntries,
  sampleBattleEntry,
  sampleBattles,
} from "@/components/leaderboards/test-utils/fixtures";

const replace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/leaderboards/battle",
  useSearchParams: () => searchParams,
}));

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

function mockFetchSequence(
  handlers: Array<(url: string) => Response | Promise<Response>>,
) {
  let call = 0;
  (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    const handler = handlers[call++];
    if (!handler) {
      throw new Error(`Unexpected fetch: ${url}`);
    }
    return Promise.resolve(handler(url));
  });
}

describe("BattleLeaderboardPage", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    replace.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("prompts the user to select a battle", () => {
    render(<BattleLeaderboardPage battles={sampleBattles} />);

    expect(
      screen.getByText("Select a battle to load its leaderboard."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Battle scores" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Guitar")).toBeInTheDocument();
  });

  it("shows an empty message when no battles are available", () => {
    render(<BattleLeaderboardPage battles={[]} />);

    expect(
      screen.getByText("No battles are available right now."),
    ).toBeInTheDocument();
  });

  it("loads scores after a battle is selected and preselects role", async () => {
    const user = userEvent.setup();

    mockFetchSequence([
      (url) => {
        expect(url).toContain("/api/leaderboards/battle?");
        expect(url).toContain("battle_id=555556");
        expect(url).toContain("page=1");
        expect(url).not.toContain("role_id");
        return jsonResponse({
          leaderboard: [sampleBattleEntry],
          page: 1,
          page_size: 20,
        });
      },
    ]);

    render(<BattleLeaderboardPage battles={sampleBattles} />);

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(
      await screen.findByRole("option", { name: "Pro Drums Challenge" }),
    );

    expect(await screen.findByText("Battle Champ")).toBeInTheDocument();
    expect(screen.getByText(/#555556/)).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(
      "/leaderboards/battle?battle_id=555556",
      { scroll: false },
    );

    const roleSelect = screen.getAllByRole("combobox")[1];
    expect(roleSelect).toHaveTextContent("Pro Drums");
    expect(roleSelect).toBeDisabled();
  });

  it("hydrates from battle_id in the URL", async () => {
    searchParams = new URLSearchParams("battle_id=555555");

    mockFetchSequence([
      (url) => {
        expect(url).toContain("battle_id=555555");
        return jsonResponse({
          leaderboard: [sampleBattleEntry],
          page: 1,
          page_size: 20,
        });
      },
    ]);

    render(<BattleLeaderboardPage battles={sampleBattles} />);

    expect(await screen.findByText("Battle Champ")).toBeInTheDocument();
    expect(screen.getByText(/#555555/)).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")[1]).toHaveTextContent("Guitar");
  });

  it("appends the next page when Load more is clicked", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("battle_id=555555");
    const pageOne = makeBattleEntries(20);
    const pageTwo = makeBattleEntries(5).map((entry, index) => ({
      ...entry,
      rank: 21 + index,
      pid: 2000 + index,
      name: `Page2 Player ${index + 1}`,
    }));

    mockFetchSequence([
      () =>
        jsonResponse({
          leaderboard: pageOne,
          page: 1,
          page_size: 20,
        }),
      (url) => {
        expect(url).toContain("page=2");
        return jsonResponse({
          leaderboard: pageTwo,
          page: 2,
          page_size: 20,
        });
      },
    ]);

    render(<BattleLeaderboardPage battles={sampleBattles} />);

    expect(await screen.findByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText(/Showing 20 scores/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more scores" }));

    expect(await screen.findByText("Page2 Player 1")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Showing 25 scores/)).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "Load more scores" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error when the leaderboard request fails", async () => {
    searchParams = new URLSearchParams("battle_id=555555");

    mockFetchSequence([
      () => jsonResponse({ error: "Failed to fetch leaderboard" }, 502),
    ]);

    render(<BattleLeaderboardPage battles={sampleBattles} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to fetch leaderboard",
    );
  });
});
