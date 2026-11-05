/** Grade for a completion percentage: S (100) down to D. */
export function gradeFor(pct) {
  if (pct >= 100) return 'S'
  if (pct >= 80) return 'A'
  if (pct >= 60) return 'B'
  if (pct >= 40) return 'C'
  return 'D'
}
