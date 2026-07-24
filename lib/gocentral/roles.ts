/** RB3 score-type order (0–10). Confirm against live data if labels look off. */
export const ROLES = [
  { id: 0, label: "Drums" },
  { id: 1, label: "Bass" },
  { id: 2, label: "Guitar" },
  { id: 3, label: "Vocals" },
  { id: 4, label: "Harmonies" },
  { id: 5, label: "Keys" },
  { id: 6, label: "Pro Drums" },
  { id: 7, label: "Pro Guitar" },
  { id: 8, label: "Pro Bass" },
  { id: 9, label: "Pro Keys" },
  { id: 10, label: "Band" },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

export const DEFAULT_ROLE_ID: RoleId = 2;

export function isRoleId(value: number): value is RoleId {
  return Number.isInteger(value) && value >= 0 && value <= 10;
}

export function roleLabel(roleId: number): string {
  return ROLES.find((role) => role.id === roleId)?.label ?? `Role ${roleId}`;
}
