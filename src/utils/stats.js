import { STREAK_THRESHOLD } from '../constants'
import { addDays, todayStr } from './date'

function passes(entry) {
  return Boolean(entry) && entry.completionPct >= STREAK_THRESHOLD
}

/**
 * Current streak of consecutive days with completion >= STREAK_THRESHOLD.
 * Counts back from today; if today has no passing entry yet, the streak
 * survives through yesterday (so finishing today can extend it).
 */
export function currentStreak(history, today = todayStr()) {
  const byDate = new Map(history.map((h) => [h.date, h]))
  let streak = 0
  let cursor = today
  if (!passes(byDate.get(cursor))) cursor = addDays(cursor, -1)
  while (passes(byDate.get(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Longest streak ever recorded in history. */
export function bestStreak(history) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  let best = 0
  let run = 0
  let prev = null
  for (const h of sorted) {
    if (!passes(h)) {
      run = 0
      prev = h.date
      continue
    }
    run = prev && addDays(prev, 1) === h.date ? run + 1 : 1
    best = Math.max(best, run)
    prev = h.date
  }
  return best
}
