import {
  TARGET_MAX,
  TARGET_MIN,
  TASK_TYPES,
  TIME_OF_DAY,
  UNIT_MAX_LEN,
  XP_MAX,
  XP_MIN,
  REPEAT_MODES,
} from '../config/constants.js'

/**
 * Task-type helpers + normalizer. Mirrors frontend utils/tasks.js and
 * storage.js normalizeTasks() so client and server agree byte-for-byte.
 */

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value))
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/** Normalize an array of task-like objects into valid tasks (any source). */
export function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) throw new Error('"tasks" must be an array')
  return tasks.map((t, i) => {
    const type = TASK_TYPES.includes(t?.type) ? t.type : 'yesno'
    const target =
      type === 'yesno' ? undefined : clampInt(t?.target, TARGET_MIN, TARGET_MAX, 1)
    const days = Array.isArray(t?.days)
      ? [...new Set(t.days.map((d) => Math.round(Number(d))).filter((d) => d >= 0 && d <= 6))]
      : undefined
    return {
      id: typeof t?.id === 'string' && t.id ? t.id : `imported-${Date.now()}-${i}`,
      name: String(t?.name ?? '').trim() || `Quest ${i + 1}`,
      emoji: String(t?.emoji ?? '✨').slice(0, 4),
      xp: clampInt(t?.xp, XP_MIN, XP_MAX, 10),
      type,
      target,
      unit: type === 'count' ? String(t?.unit ?? 'times').slice(0, UNIT_MAX_LEN) : undefined,
      progress: type === 'count' ? Math.max(0, Math.round(t?.progress || 0)) : undefined,
      minutes: type === 'timed' ? Math.max(0, Math.round(t?.minutes || 0)) : undefined,
      timer: type === 'timed' && t?.timer ? String(t.timer) : null,
      repeat: REPEAT_MODES.includes(t?.repeat) ? t.repeat : 'daily',
      days,
      onceDate: /^\d{4}-\d{2}-\d{2}$/.test(t?.onceDate || '') ? t.onceDate : undefined,
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(t?.startDate || '') ? t.startDate : undefined,
      timeOfDay: TIME_OF_DAY.includes(t?.timeOfDay) ? t.timeOfDay : 'any',
      done: Boolean(t?.done),
    }
  })
}

/** Whole units of progress logged for a task (0 for yesno). */
export function progressOf(task) {
  if (task.type === 'count') return Math.max(0, Math.round(task.progress || 0))
  if (task.type === 'timed') return Math.max(0, Math.round(task.minutes || 0))
  return 0
}

/** Daily target (undefined for yesno). */
export function targetOf(task) {
  return task.type === 'count' || task.type === 'timed'
    ? Math.max(1, Math.round(task.target || 1))
    : undefined
}

/** Is the task complete? yesno: done flag; count/timed: progress >= target. */
export function isComplete(task) {
  if (task.type === 'yesno') return Boolean(task.done)
  return progressOf(task) >= targetOf(task)
}

/** Completion percentage (0–100) used in grades, rings and bars. */
export function taskPct(task) {
  if (task.type === 'yesno') return task.done ? 100 : 0
  const pct = Math.round((progressOf(task) / targetOf(task)) * 100)
  return Math.min(100, Math.max(0, pct))
}

/** XP the task has currently granted (partial progress grants partial XP). */
export function grantedXp(task) {
  if (task.type === 'yesno') return task.done ? task.xp : 0
  return Math.min(task.xp, Math.round((taskPct(task) / 100) * task.xp))
}

/** Compact status label: Done / Skipped / "3 / 8" / "45 / 120 min". */
export function resultLabel(task) {
  if (task.type === 'count') return `${progressOf(task)} / ${targetOf(task)}`
  if (task.type === 'timed') return `${progressOf(task)} / ${targetOf(task)} min`
  return isComplete(task) ? 'Done' : 'Skipped'
}
