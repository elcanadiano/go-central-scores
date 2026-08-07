import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleSelect } from "@/components/leaderboards/role-select";

describe("RoleSelect", () => {
  it("displays the selected role label", () => {
    render(<RoleSelect value={2} onChange={jest.fn()} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Guitar");
  });

  it("calls onChange when a different role is chosen", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<RoleSelect value={2} onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Band" }));

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<RoleSelect value={6} onChange={onChange} disabled />);

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeDisabled();
    expect(combobox).toHaveTextContent("Pro Drums");

    await user.click(combobox);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
