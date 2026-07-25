import {
  DEFAULT_ROLE_ID,
  isRoleId,
  roleLabel,
  ROLES,
} from "@/lib/gocentral/roles";

describe("roles", () => {
  it("includes eleven fixed roles (0–10)", () => {
    expect(ROLES).toHaveLength(11);
    expect(ROLES[0]?.id).toBe(0);
    expect(ROLES[10]?.id).toBe(10);
  });

  it("defaults to Guitar", () => {
    expect(DEFAULT_ROLE_ID).toBe(2);
    expect(roleLabel(DEFAULT_ROLE_ID)).toBe("Guitar");
  });

  it("maps known ids to labels", () => {
    expect(roleLabel(4)).toBe("Harmonies");
    expect(roleLabel(10)).toBe("Band");
  });

  it("falls back for unknown ids", () => {
    expect(roleLabel(99)).toBe("Role 99");
  });

  it("validates role ids", () => {
    expect(isRoleId(0)).toBe(true);
    expect(isRoleId(10)).toBe(true);
    expect(isRoleId(11)).toBe(false);
    expect(isRoleId(1.5)).toBe(false);
  });
});
