import { isSongIdQuery, parseSongIdQuery } from "@/lib/songs/song-id";

describe("song-id helpers", () => {
  it("detects optional-minus integer queries", () => {
    expect(isSongIdQuery("0")).toBe(true);
    expect(isSongIdQuery("32768")).toBe(true);
    expect(isSongIdQuery("-2138671118")).toBe(true);
    expect(isSongIdQuery("-")).toBe(false);
    expect(isSongIdQuery("12a")).toBe(false);
    expect(isSongIdQuery("middle")).toBe(false);
  });

  it("parses safe integer ids", () => {
    expect(parseSongIdQuery("0")).toBe(0);
    expect(parseSongIdQuery("-2138671118")).toBe(-2138671118);
    expect(parseSongIdQuery("9".repeat(20))).toBeNull();
    expect(parseSongIdQuery("middle")).toBeNull();
  });
});
