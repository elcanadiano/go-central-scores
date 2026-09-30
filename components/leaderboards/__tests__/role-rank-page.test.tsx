import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleRankPage } from "@/components/leaderboards/role-rank-page";
import { jsonResponse } from "@/components/leaderboards/test-utils/fixtures";
import type { RoleRankEntry } from "@/lib/gocentral/types";

if (typeof window.PointerEvent !== "function") {
  window.PointerEvent = class PointerEvent extends MouseEvent {} as typeof PointerEvent;
}

const replace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/leaderboards/role-rank",
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

function makeEntries(count: number, startRank: number): RoleRankEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    pid: 1000 + startRank + index,
    name: `Player ${startRank + index}`,
    total_score: 1_000_000 - (startRank + index),
    rank: startRank + index,
  }));
}

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

describe("RoleRankPage", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    replace.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads guitar page 1 by default and hides load previous", async () => {
    mockFetchSequence([
      (url) => {
        expect(url).toContain("role_id=2");
        expect(url).toContain("rb3_only=0");
        expect(url).toContain("page=1");
        expect(url).not.toContain("pid=");
        return jsonResponse({
          leaderboard: makeEntries(1, 1),
          page: 1,
          page_size: 20,
        });
      },
    ]);

    render(<RoleRankPage />);

    expect(
      screen.getByRole("heading", { name: "Role rank" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Player 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load previous scores" }),
    ).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(
      "/leaderboards/role-rank?role_id=2&rb3_only=0",
      { scroll: false },
    );
  });

  it("refetches when the role changes", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("role_id=2&rb3_only=0");

    mockFetchSequence([
      () =>
        jsonResponse({
          leaderboard: makeEntries(1, 1),
          page: 1,
          page_size: 20,
        }),
      (url) => {
        expect(url).toContain("role_id=10");
        return jsonResponse({
          leaderboard: [
            { pid: 9, name: "Band Board", total_score: 10, rank: 1 },
          ],
          page: 1,
          page_size: 20,
        });
      },
    ]);

    render(<RoleRankPage />);
    expect(await screen.findByText("Player 1")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Band" }));

    expect(await screen.findByText("Band Board")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(
      "/leaderboards/role-rank?role_id=10&rb3_only=0",
      { scroll: false },
    );
  });

  it("refetches when the RB3 switch changes", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("role_id=2&rb3_only=0");

    mockFetchSequence([
      () =>
        jsonResponse({
          leaderboard: makeEntries(1, 1),
          page: 1,
          page_size: 20,
        }),
      (url) => {
        expect(url).toContain("rb3_only=1");
        return jsonResponse({
          leaderboard: [
            { pid: 3, name: "Disc Only", total_score: 100, rank: 1 },
          ],
          page: 1,
          page_size: 20,
        });
      },
    ]);

    render(<RoleRankPage />);
    expect(await screen.findByText("Player 1")).toBeInTheDocument();

    await user.click(
      screen.getByRole("switch", { name: "On-disc RB3 songs only" }),
    );

    expect(await screen.findByText("Disc Only")).toBeInTheDocument();

    await user.click(
      screen.getByRole("switch", { name: "On-disc RB3 songs only" }),
    );

    expect(await screen.findByText("Player 1")).toBeInTheDocument();
    expect(screen.queryByText("Disc Only")).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("appends the next page and does not send pid", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("role_id=2&rb3_only=0&pid=883100");
    const pageOne = makeEntries(20, 1);

    mockFetchSequence([
      (url) => {
        expect(url).toContain("pid=883100");
        expect(url).not.toContain("page=");
        return jsonResponse({
          leaderboard: pageOne,
          page: 1,
          page_size: 20,
        });
      },
      (url) => {
        expect(url).toContain("page=2");
        expect(url).not.toContain("pid=");
        return jsonResponse({
          leaderboard: makeEntries(1, 21).map((entry) => ({
            ...entry,
            name: "Page2 Player",
          })),
          page: 2,
          page_size: 20,
        });
      },
    ]);

    render(<RoleRankPage />);
    expect(await screen.findByText("Player 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load previous scores" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more scores" }));
    expect(await screen.findByText("Page2 Player")).toBeInTheDocument();
  });

  it("centers on a URL pid and loads the previous page without pid", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("role_id=2&rb3_only=0&pid=883100");

    mockFetchSequence([
      (url) => {
        expect(url).toContain("pid=883100");
        expect(url).not.toContain("page=");
        return jsonResponse({
          leaderboard: makeEntries(20, 41),
          page: 3,
          page_size: 20,
        });
      },
      (url) => {
        expect(url).toContain("page=2");
        expect(url).not.toContain("pid=");
        return jsonResponse({
          leaderboard: makeEntries(1, 21).map((entry) => ({
            ...entry,
            name: "Earlier Player",
          })),
          page: 2,
          page_size: 20,
        });
      },
    ]);

    render(<RoleRankPage />);
    expect(await screen.findByText("Player 41")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Load previous scores" }),
    );
    expect(await screen.findByText("Earlier Player")).toBeInTheDocument();
  });

  it("shows an error when the leaderboard request fails", async () => {
    searchParams = new URLSearchParams("role_id=2&rb3_only=0");
    mockFetchSequence([
      () => jsonResponse({ error: "Failed to fetch leaderboard" }, 502),
    ]);

    render(<RoleRankPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Failed to fetch leaderboard",
      );
    });
  });
});
