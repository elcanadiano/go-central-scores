import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "@/app/layout";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
  Inter: () => ({ variable: "--font-sans" }),
}));

jest.mock("@/app/globals.css", () => ({}));

describe("app/layout", () => {
  it("exports root metadata", () => {
    expect(metadata).toEqual({
      title: "Go Central Scores",
      description: "Song leaderboards and score tools for GoCentral.",
    });
  });

  it("renders children inside the document shell", () => {
    render(
      <RootLayout>
        <div>Leaderboard child</div>
      </RootLayout>,
    );

    // Root layout html/body are applied to the document, not the RTL container.
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveClass(
      "h-full",
      "antialiased",
      "font-sans",
    );
    expect(document.documentElement.className).toContain("--font-geist-sans");
    expect(document.documentElement.className).toContain("--font-geist-mono");
    expect(document.documentElement.className).toContain("--font-sans");

    expect(document.body).toHaveClass("min-h-full", "flex", "flex-col");
    expect(screen.getByText("Leaderboard child")).toBeInTheDocument();
  });
});
