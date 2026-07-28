import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@/components/layout/site-footer";

describe("SiteFooter", () => {
  it("renders affiliation disclaimers", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByText(/GoCentralScores is not affiliated with Harmonix Music Systems/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/MiloHax, GOCentral, or the RBEnhanced projects/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/acknowledge the use of the GOCentral API/),
    ).toBeInTheDocument();
  });

  it("links the site credit to the author GitHub profile", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "elcanadiano" })).toHaveAttribute(
      "href",
      "https://github.com/elcanadiano",
    );
    expect(screen.getByText(/site by/i)).toBeInTheDocument();
  });
});
