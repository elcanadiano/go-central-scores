import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SongLeaderboardPage } from "@/components/leaderboards/song-leaderboard-page";
import {
  jsonResponse,
  makeEntries,
  sampleEntry,
  sampleSong,
} from "@/components/leaderboards/test-utils/fixtures";

const replace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/leaderboards/song",
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

describe("SongLeaderboardPage", () => {
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

  it("prompts the user to select a song", () => {
    render(<SongLeaderboardPage />);

    expect(
      screen.getByText("Select a song to load its leaderboard."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Song scores" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search by name, artist, album, or song ID/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Guitar")).toBeInTheDocument();
  });

  it("loads scores after a song is selected", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    mockFetchSequence([
      () => jsonResponse({ songs: [sampleSong] }),
      (url) => {
        expect(url).toContain("/api/leaderboards/song?");
        expect(url).toContain("song_id=32768");
        expect(url).toContain("role_id=2");
        expect(url).toContain("page=1");
        return jsonResponse({
          leaderboard: [sampleEntry],
          page: 1,
          page_size: 20,
        });
      },
    ]);

    render(<SongLeaderboardPage />);

    const songInput = screen.getByPlaceholderText(
      /Search by name, artist, album, or song ID/i,
    );
    await user.type(songInput, "middle");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await user.click(
      await screen.findByRole("button", { name: /The Middle/i }),
    );

    expect(await screen.findByText("Unnamed Band")).toBeInTheDocument();
    expect(screen.getByText(/#32768/)).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(
      "/leaderboards/song?song_id=32768&role_id=2",
      { scroll: false },
    );
  });

  it("hydrates from song_id in the URL", async () => {
    searchParams = new URLSearchParams("song_id=32768&role_id=10");

    mockFetchSequence([
      (url) => {
        expect(url).toBe("/api/songs/search?q=32768");
        return jsonResponse({ songs: [sampleSong] });
      },
      (url) => {
        expect(url).toContain("role_id=10");
        return jsonResponse({
          leaderboard: [sampleEntry],
          page: 1,
          page_size: 20,
        });
      },
    ]);

    render(<SongLeaderboardPage />);

    expect(await screen.findByText("Unnamed Band")).toBeInTheDocument();
    expect(screen.getByText("The Middle")).toBeInTheDocument();
  });

  it("appends the next page when Load more is clicked", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("song_id=32768&role_id=2");
    const pageOne = makeEntries(20);
    const pageTwo = makeEntries(5).map((entry, index) => ({
      ...entry,
      rank: 21 + index,
      pid: 2000 + index,
      name: `Page2 Player ${index + 1}`,
    }));

    mockFetchSequence([
      () => jsonResponse({ songs: [sampleSong] }),
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

    render(<SongLeaderboardPage />);

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
    searchParams = new URLSearchParams("song_id=32768&role_id=2");

    mockFetchSequence([
      () => jsonResponse({ songs: [sampleSong] }),
      () => jsonResponse({ error: "Failed to fetch leaderboard" }, 502),
    ]);

    render(<SongLeaderboardPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to fetch leaderboard",
    );
  });
});
