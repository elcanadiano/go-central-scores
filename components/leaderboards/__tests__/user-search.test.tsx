import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserSearch } from "@/components/leaderboards/user-search";
import { jsonResponse } from "@/components/leaderboards/test-utils/fixtures";

const sampleUser = { pid: 886100, username: "elcanadiano" };

describe("UserSearch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("does not search until two characters", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<UserSearch selected={null} onSelect={jest.fn()} />);

    await user.type(screen.getByPlaceholderText("Search by name"), "e");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("searches after the debounce and selects a player", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSelect = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ users: [sampleUser] }),
    );

    render(<UserSearch selected={null} onSelect={onSelect} />);
    await user.type(screen.getByPlaceholderText("Search by name"), "el");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/search?q=el",
      expect.any(Object),
    );
    await user.click(await screen.findByRole("button", { name: "elcanadiano" }));
    expect(onSelect).toHaveBeenCalledWith(sampleUser);
  });

  it("keeps search status out of the layout flow", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ users: [] }));

    render(<UserSearch selected={null} onSelect={jest.fn()} />);
    await user.type(screen.getByPlaceholderText("Search by name"), "el");
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText("No players found")).toHaveClass(
      "sm:absolute",
    );
  });
});
