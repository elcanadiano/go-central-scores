import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleSelect } from "@/components/leaderboards/battle-select";
import { sampleBattles } from "@/components/leaderboards/test-utils/fixtures";

describe("BattleSelect", () => {
  it("shows a placeholder when nothing is selected", () => {
    render(
      <BattleSelect battles={sampleBattles} value={null} onChange={jest.fn()} />,
    );

    const combobox = screen.getByRole("combobox");
    expect(combobox).not.toHaveTextContent("Weekend Warrior");
    expect(combobox).not.toHaveTextContent("Pro Drums Challenge");
  });

  it("displays the selected battle title", () => {
    render(
      <BattleSelect
        battles={sampleBattles}
        value={555555}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Weekend Warrior");
  });

  it("calls onChange with the chosen battle", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <BattleSelect
        battles={sampleBattles}
        value={null}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Pro Drums Challenge" }),
    );

    expect(onChange).toHaveBeenCalledWith(sampleBattles[1]);
  });
});
