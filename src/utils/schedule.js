import { todayStr } from './date'

/**
 * Monday-first day index for a YYYY-MM-DD string (0 = Mon … 6 = Sun).
 * Date.getDay(): Sun=0 … Sat=6  →  (day + 6) % 7 maps Sun→6, Mon→0.
 */
export function dayIndexOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

/**
 * Is `task` scheduled on `dateStr`?
 * Rules:
 * - daily      → always
 * - weekdays   → Mon–Fri
 * - weekends   → Sat–Sun
 * - custom     → only the days in `task.days` (Monday-first indexes)
 * - once       → only on `task.onceDate`
 * AND every task needs `dateStr >= (task.startDate || today)`, so a task
 * never appears on — or counts as missed for — days before it was created.
 */
export function isScheduledOn(task, dateStr) {
  const start = task.startDate || todayStr()
  if (dateStr < start) return false

  switch (task.repeat) {
    case 'weekdays':
      return dayIndexOf(dateStr) <= 4
    case 'weekends':
      return dayIndexOf(dateStr) >= 5
    case 'custom':
      return Array.isArray(task.days) && task.days.includes(dayIndexOf(dateStr))
    case 'once':
      return task.onceDate === dateStr
    case 'daily':
    default:
      return true
  }
}

/** Only the tasks scheduled on `dateStr` (defaults to today). */
export function scheduledTasks(tasks, dateStr = todayStr()) {
  return tasks.filter((t) => isScheduledOn(t, dateStr))
}
