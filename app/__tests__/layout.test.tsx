import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "@/app/layout";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
  Inter: () => ({ variable: "--font-sans" }),
}));

jest.mock("@/app/globals.css", () => ({}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("app/layout", () => {
  it("exports root metadata", () => {
    expect(metadata).toEqual({
      title: "GoCentralScores",
      description: "Song leaderboards and score tools for GoCentral.",
    });
  });

  it("renders the site header, footer, and children inside the document shell", () => {
    render(
      <RootLayout>
        <div>Leaderboard child</div>
      </RootLayout>,
    );

    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveClass(
      "h-full",
      "antialiased",
      "font-sans",
    );
    expect(document.documentElement.className).toContain("--font-geist-sans");
    expect(document.documentElement.className).toContain("--font-geist-mono");
    expect(document.documentElement.className).toContain("--font-sans");

    expect(document.body).toHaveClass(
      "min-h-full",
      "flex",
      "flex-col",
      "bg-background",
      "text-foreground",
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "GoCentralScores" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toContainElement(
      screen.getByText("Leaderboard child"),
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "elcanadiano" }),
    ).toHaveAttribute("href", "https://github.com/elcanadiano");
  });
});
