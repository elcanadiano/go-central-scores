const DIFFICULTY_LABELS: Record<number, string> = {
  0: "Easy",
  1: "Medium",
  2: "Hard",
  3: "Expert",
  4: "Expert+",
};

export function difficultyLabel(diffId: number): string {
  return DIFFICULTY_LABELS[diffId] ?? `Diff ${diffId}`;
}
