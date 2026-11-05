import {
  FOCUS_COMPLETE_BONUS,
  FOCUS_MAX_PAUSES_FOR_BONUS,
  FOCUS_MIN_MINUTES,
  FOCUS_XP_PER_MIN,
} from '../config/constants.js'

/**
 * Focus-session XP math (mirrors frontend utils/focus.js).
 * Sessions under FOCUS_MIN_MINUTES log nothing (anti-farm).
 */
export function sessionXp(focusedMin, { completed = false, pauses = 0 } = {}) {
  const mins = Math.floor(Math.max(0, focusedMin))
  if (mins < FOCUS_MIN_MINUTES) return 0
  let xp = mins * FOCUS_XP_PER_MIN
  if (completed && pauses <= FOCUS_MAX_PAUSES_FOR_BONUS) xp += FOCUS_COMPLETE_BONUS
  return Math.round(xp)
}

/** Minutes focused between two ISO timestamps, rounded down. */
export function minutesBetween(startIso, endIso) {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.floor(Math.max(0, end - start) / 60_000)
}
