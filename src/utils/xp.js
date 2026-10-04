import { LEVEL_CAP } from '../constants'

const BASE = 100
const EXPONENT = 1.5

/**
 * XP needed to go from `level` to `level + 1`.
 * Grows on a power curve so later levels get progressively harder.
 */
export function xpForLevel(level) {
  return Math.round(BASE * Math.pow(level, EXPONENT))
}

/** Cumulative XP required to *be* at `level` (level 1 starts at 0). */
export function totalXpForLevel(level) {
  let sum = 0
  for (let l = 1; l < level; l++) sum += xpForLevel(l)
  return sum
}

/** Derive the current level and progress toward the next one from total XP. */
export function levelProgress(totalXp) {
  let level = 1
  while (level < LEVEL_CAP && totalXp >= totalXpForLevel(level + 1)) level++
  const floorXp = totalXpForLevel(level)
  const nextXp = totalXpForLevel(level + 1)
  const current = totalXp - floorXp
  const needed = nextXp - floorXp
  return {
    level,
    current,
    needed,
    pct: needed > 0 ? Math.round((current / needed) * 100) : 100,
  }
}
