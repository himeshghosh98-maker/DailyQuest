import { todayStr } from './date.js'

/**
 * Is `task` scheduled on `dateStr`? (Mirrors frontend schedule.js)
 * Rules: daily → always; weekdays → Mon–Fri; weekends → Sat–Sun;
 * custom → task.days (Monday-first); once → task.onceDate.
 * And never before task.startDate.
 */
export function isScheduledOn(task, dateStr) {
  const start = task.startDate || todayStr()
  if (dateStr < start) return false

  switch (task.repeat) {
    case 'weekdays':
      return dayIdx(dateStr) <= 4
    case 'weekends':
      return dayIdx(dateStr) >= 5
    case 'custom':
      return Array.isArray(task.days) && task.days.includes(dayIdx(dateStr))
    case 'once':
      return task.onceDate === dateStr
    case 'daily':
    default:
      return true
  }
}

function dayIdx(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

/** Only the tasks scheduled on `dateStr`. */
export function scheduledTasks(tasks, dateStr = todayStr()) {
  return tasks.filter((t) => isScheduledOn(t, dateStr))
}
