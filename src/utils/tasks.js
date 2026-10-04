/**
 * Task-type helpers: progress values, completion percentage, and human
 * labels for the current result ("3 / 8", "45 / 120 min", "Done").
 */

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

/** Completion percentage used in grades, rings and bars. */
export function taskPct(task) {
  if (task.type === 'yesno') return task.done ? 100 : 0
  const pct = Math.round((progressOf(task) / targetOf(task)) * 100)
  return Math.min(100, Math.max(0, pct))
}

/**
 * XP the task has currently granted: yesno = full xp when done;
 * count/timed = xp scaled by progress, capped at the full value at target.
 */
export function grantedXp(task) {
  if (task.type === 'yesno') return task.done ? task.xp : 0
  return Math.min(task.xp, Math.round((taskPct(task) / 100) * task.xp))
}

/** Compact status label for rows and the report: Done, 3 / 8, 45 / 120 min, Skipped. */
export function resultLabel(task) {
  if (task.type === 'count') {
    const p = progressOf(task)
    const t = targetOf(task)
    return `${p} / ${t}`
  }
  if (task.type === 'timed') {
    const p = progressOf(task)
    const t = targetOf(task)
    return `${p} / ${t} min`
  }
  return isComplete(task) ? 'Done' : 'Skipped'
}

/** Label for partial progress (rows, rings, report details). */
export function progressLabel(task) {
  if (task.type === 'count') {
    return `${progressOf(task)} / ${targetOf(task)}${task.unit ? ` ${task.unit}` : ''}`
  }
  if (task.type === 'timed') {
    return `${progressOf(task)} / ${targetOf(task)} min`
  }
  return ''
}
