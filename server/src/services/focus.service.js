import crypto from 'node:crypto'
import ApiError from '../utils/ApiError.js'
import { FOCUS_SESSIONS_MAX } from '../config/constants.js'
import { todayStr } from '../utils/date.js'
import { grantedXp } from '../utils/tasks.js'
import { minutesBetween, sessionXp } from '../utils/focus.js'
import { getStateDoc, saveStateDoc, toClientShape } from './state.service.js'

/**
 * Focus sessions — mirror of the frontend reducer's FOCUS_* actions.
 * The active session lives in state.focus with the same timestamp fields
 * ({ elapsedMs, startedAt, running, pauses, … }) so elapsed time is always
 * DERIVED from clocks, never counters.
 */

const FOCUS_MODES = ['pomodoro', 'custom', 'stopwatch']
const PHASES = ['focus', 'break', 'longBreak']

/** Validate/normalize an active-session object (frontend sanitizeSession). */
function sanitizeSession(f) {
  if (!f || typeof f !== 'object' || !f.taskId) return null
  return {
    taskId: String(f.taskId),
    taskName: String(f.taskName || ''),
    taskEmoji: String(f.taskEmoji || '✨'),
    mode: FOCUS_MODES.includes(f.mode) ? f.mode : 'pomodoro',
    phase: PHASES.includes(f.phase) ? f.phase : 'focus',
    sessionIndex: Math.max(1, Math.round(Number(f.sessionIndex)) || 1),
    customMin: Math.max(1, Math.round(Number(f.customMin)) || 25),
    startedAt: f.running ? Number(f.startedAt) || null : null,
    startedAtReal: Number(f.startedAtReal) || Date.now(),
    elapsedMs: Math.max(0, Number(f.elapsedMs) || 0),
    running: Boolean(f.running),
    pauses: Math.max(0, Math.round(Number(f.pauses)) || 0),
    day: typeof f.day === 'string' ? f.day : undefined,
  }
}

/** ms elapsed in a session (banked + live segment). */
function elapsedMsOf(session, now = Date.now()) {
  const banked = Math.max(0, Number(session.elapsedMs) || 0)
  if (!session.running || !session.startedAt) return banked
  return banked + Math.max(0, now - Number(session.startedAt))
}

/**
 * Close an active session: XP + optional history record + timed-task
 * minutes (settled through grantedXp). Mutates the doc; caller saves.
 * Returns { session, xp, minutes } where session is null when nothing
 * qualifies (sub-minute sessions log nothing — anti-farm).
 */
function closeSession(doc, session, { completed = false, elapsedMs, pauses } = {}) {
  const mins = Math.floor(
    (elapsedMs !== undefined ? Math.max(0, Number(elapsedMs) || 0) : elapsedMsOf(session)) / 60000,
  )
  const usedPauses = pauses !== undefined ? Math.max(0, Math.round(Number(pauses)) || 0) : session.pauses || 0
  const xp = sessionXp(mins, { completed, pauses: usedPauses })

  let record = null
  if (mins >= 1) {
    record = {
      id: crypto.randomUUID(),
      taskId: session.taskId || null,
      taskName: session.taskName || '',
      date: session.day || todayStr(),
      startedAt: new Date(session.startedAtReal || Date.now()).toISOString(),
      minutes: mins,
      completed: Boolean(completed),
      mode: session.mode || 'pomodoro',
      pauses: usedPauses,
    }
    doc.focusSessions = [...(doc.focusSessions || []), record].slice(-FOCUS_SESSIONS_MAX)

    // Bank focused minutes onto the linked timed task (XP settles too).
    const idx = (doc.tasks || []).findIndex((t) => t && t.id === session.taskId && t.type === 'timed')
    if (idx !== -1) {
      const prev = doc.tasks[idx]
      const next = { ...prev, minutes: (Number(prev.minutes) || 0) + mins, timer: null }
      const tasks = [...doc.tasks]
      tasks[idx] = next
      doc.tasks = tasks
      doc.totalXp = Math.max(0, (Number(doc.totalXp) || 0) + grantedXp(next) - grantedXp(prev))
    }
  }

  doc.totalXp = Math.max(0, (Number(doc.totalXp) || 0) + xp)
  return { record, xp, minutes: mins }
}

/** POST /focus/start — replaces (and first closes) any active session. */
export async function startSession(userId, { task, mode, customMin }) {
  const doc = await getStateDoc(userId)

  const prev = sanitizeSession(doc.focus)
  let closed = null
  if (prev && (prev.running || prev.elapsedMs > 0)) {
    const res = closeSession(doc, prev, { completed: false })
    if (res.record) closed = res.record
  }

  const now = Date.now()
  doc.focus = {
    taskId: String(task.id),
    taskName: String(task.name || ''),
    taskEmoji: String(task.emoji || '✨'),
    mode: FOCUS_MODES.includes(mode) ? mode : 'pomodoro',
    phase: 'focus',
    sessionIndex: 1,
    customMin: Math.max(1, Math.round(Number(customMin) || 25)),
    startedAt: now,
    startedAtReal: now,
    elapsedMs: 0,
    running: true,
    pauses: 0,
    day: todayStr(),
  }
  await saveStateDoc(doc)
  return { focus: doc.focus, replacedSession: closed, state: toClientShape(doc) }
}

/**
 * POST /focus/stop — end the session. `elapsedMs`/`pauses`/`completed`
 * may be supplied by the client (it owns the live clock); otherwise the
 * server derives elapsed time from its own start timestamp.
 */
export async function stopSession(userId, { completed = false, elapsedMs, pauses } = {}) {
  const doc = await getStateDoc(userId)
  const session = sanitizeSession(doc.focus)
  if (!session) throw ApiError.notFound('No active focus session.')

  const res = closeSession(doc, session, { completed, elapsedMs, pauses })
  doc.focus = null
  await saveStateDoc(doc)
  return { session: res.record, xp: res.xp, minutes: res.minutes, state: toClientShape(doc) }
}

/** GET /focus/sessions — history (newest first, capped). */
export async function history(userId, { limit, date } = {}) {
  const doc = await getStateDoc(userId)
  let sessions = [...(doc.focusSessions || [])]
  if (date) sessions = sessions.filter((s) => s.date === date)
  sessions.reverse() // storage order is oldest-first; API returns newest-first
  if (limit) sessions = sessions.slice(0, limit)
  return {
    sessions,
    active: sanitizeSession(doc.focus),
    totalMinutes: (doc.focusSessions || []).reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
    totalXp: Math.max(0, Number(doc.totalXp) || 0),
  }
}

/** Total focused minutes for a date range (used by reports/AI). */
export function focusedMinutesBetween(sessions, from, to) {
  return (sessions || [])
    .filter((s) => s.date >= from && s.date <= to)
    .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0)
}

export { minutesBetween }
