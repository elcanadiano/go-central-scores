import { render, screen } from "@testing-library/react";
import Page, { metadata } from "@/app/leaderboards/battle/page";
import { sampleBattles } from "@/components/leaderboards/test-utils/fixtures";

jest.mock("@/lib/gocentral/battles", () => ({
  fetchBattles: jest.fn(),
}));

jest.mock("@/components/leaderboards/battle-leaderboard-page", () => ({
  BattleLeaderboardPage: ({
    battles,
  }: {
    battles: { battle_id: number; title: string }[];
  }) => (
    <div>
      Battle leaderboard content ({battles.length} battles)
    </div>
  ),
}));

import { fetchBattles } from "@/lib/gocentral/battles";

describe("app/leaderboards/battle/page", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("exports battle leaderboard metadata", () => {
    expect(metadata).toEqual({
      title: "Battle leaderboard",
      description: "Browse battle leaderboards from GoCentral.",
    });
  });

  it("renders the battle leaderboard page with fetched battles", async () => {
    (fetchBattles as jest.Mock).mockResolvedValue(sampleBattles);

    const ui = await Page();
    render(ui);

    expect(
      screen.getByText("Battle leaderboard content (2 battles)"),
    ).toBeInTheDocument();
  });

  it("renders with an empty battle list when fetch fails", async () => {
    (fetchBattles as jest.Mock).mockRejectedValue(
      new Error("GOCENTRAL_API_BASE_URL is not configured"),
    );

    const ui = await Page();
    render(ui);

    expect(
      screen.getByText("Battle leaderboard content (0 battles)"),
    ).toBeInTheDocument();
  });
});
