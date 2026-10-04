import {
  FOCUS_COMPLETE_BONUS,
  FOCUS_DEFAULTS,
  FOCUS_MAX_PAUSES_FOR_BONUS,
  FOCUS_MIN_MINUTES,
  FOCUS_XP_PER_MIN,
} from '../constants'

/**
 * Focus-session math. A session is ALWAYS derived from timestamps:
 *   { startedAt (ms epoch of the current running segment) | null,
 *     elapsedMs (ms banked across paused segments),
 *     running (boolean) }
 * Elapsed = elapsedMs + (running ? now - startedAt : 0). No counters, so a
 * refresh/tab-switch/sleep can never drift the clock.
 */

/** ms elapsed in the current session (banked + live segment). */
export function elapsedMs(session, now = Date.now()) {
  if (!session) return 0
  const banked = Math.max(0, Number(session.elapsedMs) || 0)
  if (!session.running || !session.startedAt) return banked
  return banked + Math.max(0, now - Number(session.startedAt))
}

/** ms remaining for countdown modes; 0 for stopwatch. */
export function remainingMs(session, now = Date.now()) {
  if (!session || session.mode === 'stopwatch') return 0
  return Math.max(0, durationMs(session, session.phase) - elapsedMs(session, now))
}

/**
 * Planned duration of a phase, in ms, honoring Settings. `settings` uses the
 * app's keys (pomodoroFocus / pomodoroBreak / pomodoroLongBreak); pomodoro
 * mode reads them, custom mode uses the session's own focus length.
 */
export function durationMs(session, phase, settings) {
  if (session?.mode === 'custom' && phase === 'focus') {
    return Math.max(1, Math.round(session.customMin || 25)) * 60_000
  }
  const s = { pomodoroFocus: 25, pomodoroBreak: 5, pomodoroLongBreak: 15, ...settings }
  if (phase === 'focus') return s.pomodoroFocus * 60_000
  return (phase === 'longBreak' ? s.pomodoroLongBreak : s.pomodoroBreak) * 60_000
}

/** True when the countdown for the current phase has reached zero. */
export function phaseComplete(session, now = Date.now()) {
  if (!session || session.mode === 'stopwatch' || !session.running) return false
  return remainingMs(session, now) <= 0
}

/** "24:13" (or "1:04:09") from milliseconds. */
export function fmtClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

/** "1h 25m" / "45m" from whole minutes. */
export function fmtMinutes(mins) {
  const m = Math.max(0, Math.round(mins))
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m}m`
}

/** Ring fraction 0..1 for the current phase (stopwatch: minutes mod hour). */
export function ringFraction(session, now = Date.now()) {
  if (!session) return 0
  if (session.mode === 'stopwatch') {
    const s = Math.floor(elapsedMs(session, now) / 1000)
    return (s % 3600) / 3600
  }
  const total = durationMs(session, session.phase, session.settings)
  const remain = remainingMs(session, now)
  return total > 0 ? 1 - remain / total : 0
}

/** Next phase after a completed focus phase (pomodoro cycling). */
export function nextPhase(session, perLong = 4) {
  if (session.mode !== 'pomodoro') return 'focus'
  const idx = session.sessionIndex || 1
  return idx % perLong === 0 ? 'longBreak' : 'break'
}

/**
 * XP earned by a finished focus session: proportional to focused minutes,
 * plus a completion bonus when it ran to the end with few pauses.
 * Sessions under FOCUS_MIN_MINUTES log nothing.
 */
export function sessionXp(focusedMin, { completed = false, pauses = 0 } = {}) {
  const mins = Math.floor(Math.max(0, focusedMin))
  if (mins < FOCUS_MIN_MINUTES) return 0
  let xp = mins * FOCUS_XP_PER_MIN
  if (completed && pauses <= FOCUS_MAX_PAUSES_FOR_BONUS) xp += FOCUS_COMPLETE_BONUS
  return Math.round(xp)
}

/** Minutes focused, rounded down, for logging (break time never passes here). */
export function focusedMinutes(session, now = Date.now()) {
  return Math.floor(elapsedMs(session, now) / 60_000)
}

/** Short label for the current phase. */
export function phaseLabel(phase) {
  if (phase === 'break') return 'Break'
  if (phase === 'longBreak') return 'Long break'
  return 'Focus'
}
