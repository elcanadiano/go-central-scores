import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SongSearch } from "@/components/leaderboards/song-search";
import {
  jsonResponse,
  sampleSong,
} from "@/components/leaderboards/test-utils/fixtures";

describe("SongSearch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("does not search for a single letter of text", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SongSearch selected={null} onSelect={jest.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Search by name, artist, album, or song ID/i),
      "a",
    );
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("searches after debounce and lets the user pick a song", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSelect = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ songs: [sampleSong] }),
    );

    render(<SongSearch selected={null} onSelect={onSelect} />);

    const input = screen.getByPlaceholderText(
      /Search by name, artist, album, or song ID/i,
    );
    await user.type(input, "middle");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/songs/search?q=middle",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await user.click(
      await screen.findByRole("button", { name: /The Middle/i }),
    );

    expect(onSelect).toHaveBeenCalledWith(sampleSong);
    expect(input).toHaveValue(
      "The Middle — Jimmy Eat World (Bleed American)",
    );
  });

  it("shows an error when search fails", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse("nope", 500));

    render(<SongSearch selected={null} onSelect={jest.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/Search by name, artist, album, or song ID/i),
      "middle",
    );
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(
      await screen.findByText("Could not search songs"),
    ).toBeInTheDocument();
  });

  it("initializes with the selected song label", () => {
    render(<SongSearch selected={sampleSong} onSelect={jest.fn()} />);

    expect(
      screen.getByPlaceholderText(/Search by name, artist, album, or song ID/i),
    ).toHaveValue("The Middle — Jimmy Eat World (Bleed American)");
  });
});
