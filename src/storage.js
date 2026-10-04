import {
  DEFAULT_TASKS,
  FOCUS_LIMITS,
  FOCUS_MODES,
  REPEAT_MODES,
  STORAGE_KEY,
  TARGET_MAX,
  TARGET_MIN,
  TASK_TYPES,
  TIME_OF_DAY,
  UNIT_MAX_LEN,
  XP_MAX,
  XP_MIN,
} from './constants'

export function loadState() {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? migrateState(JSON.parse(raw)) : null
  } catch (err) {
    console.error('DailyQuest: failed to load state', err)
    return null
  }
}

export function saveState(state) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('DailyQuest: failed to save state', err)
  }
}

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
      id:
        typeof t?.id === 'string' && t.id
          ? t.id
          : `imported-${Date.now()}-${i}`,
      name: String(t?.name ?? '').trim() || `Quest ${i + 1}`,
      emoji: String(t?.emoji ?? '✨').slice(0, 4),
      xp: clampInt(t?.xp, XP_MIN, XP_MAX, 10),
      type,
      // Count/timed targets; undefined for yesno keeps old saves intact.
      target,
      unit: type === 'count' ? String(t?.unit ?? 'times').slice(0, UNIT_MAX_LEN) : undefined,
      progress: type === 'count' ? Math.max(0, Math.round(t?.progress || 0)) : undefined,
      minutes: type === 'timed' ? Math.max(0, Math.round(t?.minutes || 0)) : undefined,
      timer: type === 'timed' && t?.timer ? String(t.timer) : null,
      // Schedule: old tasks without a repeat rule were daily Yes/No quests.
      repeat: REPEAT_MODES.includes(t?.repeat) ? t.repeat : 'daily',
      days,
      onceDate: /^\d{4}-\d{2}-\d{2}$/.test(t?.onceDate || '') ? t.onceDate : undefined,
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(t?.startDate || '') ? t.startDate : undefined,
      timeOfDay: TIME_OF_DAY.includes(t?.timeOfDay) ? t.timeOfDay : 'any',
      done: Boolean(t?.done),
    }
  })
}

/**
 * Bring a loaded/legacy state up to DATA_VERSION. Idempotent — running it
 * twice changes nothing. v2: task types + repeat rules; v3: focus sessions.
 */
export function migrateState(state) {
  if (!state || typeof state !== 'object') return state
  if (state.version < 2) {
    state = {
      ...state,
      version: 2,
      tasks: normalizeTasks(state.tasks || []),
      // History entries already snapshot per-task results; normalize them so
      // type/target/unit/result fields exist (old snapshots become yesno).
      history: (Array.isArray(state.history) ? state.history : []).map((h) => ({
        ...h,
        tasks: normalizeTasks(h.tasks || []).map(({ id, name, emoji, xp, type, target, unit, progress, minutes, done }) => ({
          id, name, emoji, xp, type, target, unit, progress, minutes, done,
        })),
      })),
    }
  }
  if (state.version < 3) {
    state = {
      ...state,
      version: 3,
      // Session records: [{id, taskId, taskName, date, startedAt (ISO),
      // minutes, completed, mode, pauses}]. Old saves simply get none.
      focusSessions: Array.isArray(state.focusSessions)
        ? state.focusSessions.filter((f) => f && typeof f.date === 'string' && typeof f.minutes === 'number')
        : [],
      // A mid-session save survives migration untouched (validated in the
      // reducer's focus actions); a legacy state just has no active session.
      focus: state.focus && typeof state.focus === 'object' ? state.focus : null,
    }
  }
  return state
}

/**
 * Parse and validate an imported backup file, returning a state-shaped object.
 * Throws with a friendly message when the file is not a DailyQuest backup.
 */
export function parseBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Not a DailyQuest backup file.')
  }
  if (data.tasks !== undefined && !Array.isArray(data.tasks)) {
    throw new Error('"tasks" in the backup is invalid.')
  }
  if (data.history !== undefined && !Array.isArray(data.history)) {
    throw new Error('"history" in the backup is invalid.')
  }
  return {
    version: 3,
    tasks: data.tasks ? normalizeTasks(data.tasks) : [],
    totalXp: clampInt(data.totalXp, 0, Number.MAX_SAFE_INTEGER, 0),
    history: data.history
      ? data.history.filter(
          (h) => h && typeof h.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(h.date),
        )
      : [],
    focusSessions: Array.isArray(data.focusSessions)
      ? data.focusSessions.filter((f) => f && typeof f.date === 'string' && typeof f.minutes === 'number')
      : [],
    settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
    lastActiveDate:
      typeof data.lastActiveDate === 'string' ? data.lastActiveDate : undefined,
  }
}

/** Download the current state as a JSON backup file. */
export function downloadBackup(state) {
  const payload = {
    app: 'DailyQuest',
    exportedAt: new Date().toISOString(),
    tasks: state.tasks,
    totalXp: state.totalXp,
    history: state.history,
    focusSessions: state.focusSessions,
    settings: state.settings,
    lastActiveDate: state.lastActiveDate,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dailyquest-backup-${state.lastActiveDate || 'export'}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
