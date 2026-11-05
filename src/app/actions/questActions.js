'use server'

import { DEFAULT_TASKS, DATA_VERSION, BADGE_XP } from '../../constants'
import { BADGES } from '../../utils/badges'

/**
 * Server Action: fetchInitialQuestData
 * Provides initial server-side state so Server Components render with
 * data already present, eliminating the client-side loading flash.
 */
export async function fetchInitialQuestData() {
  const today = new Date().toISOString().slice(0, 10)

  const normalizedDefaultTasks = DEFAULT_TASKS.map((t, i) => ({
    id: `server-default-${i + 1}`,
    name: t.name,
    emoji: t.emoji,
    xp: t.xp,
    type: t.type || 'yesno',
    target: t.target,
    unit: t.unit,
    progress: 0,
    minutes: 0,
    timer: null,
    repeat: 'daily',
    startDate: today,
    timeOfDay: 'any',
    done: false,
  }))

  return {
    version: DATA_VERSION,
    tasks: normalizedDefaultTasks,
    totalXp: 0,
    history: [],
    focusSessions: [],
    badges: {},
    availableBadges: BADGES.map(({ id, emoji, name, description }) => ({ id, emoji, name, description })),
    todayDate: today,
    settings: {
      theme: 'light',
      notifEnabled: false,
      pomodoroFocus: 25,
      pomodoroBreak: 5,
      pomodoroLongBreak: 15,
      focusSound: true,
      focusVolume: 0.6,
    },
  }
}

/**
 * Server Action: validateQuestAction
 * Validates quest data on the server before client persistence.
 */
export async function validateQuestAction(payload) {
  if (!payload || !payload.name || !payload.name.trim()) {
    return { success: false, error: 'Quest title is required.' }
  }

  const sanitized = {
    name: payload.name.trim().slice(0, 80),
    emoji: (payload.emoji || '✨').slice(0, 4),
    xp: Math.min(100, Math.max(5, Math.round(Number(payload.xp)) || 10)),
    type: ['yesno', 'count', 'timed'].includes(payload.type) ? payload.type : 'yesno',
    target: payload.type === 'yesno' ? undefined : Math.max(1, Number(payload.target) || 1),
    unit: payload.type === 'count' ? String(payload.unit || 'times').slice(0, 12) : undefined,
    repeat: ['daily', 'weekdays', 'weekends', 'custom', 'once'].includes(payload.repeat)
      ? payload.repeat
      : 'daily',
    timeOfDay: ['any', 'morning', 'afternoon', 'evening'].includes(payload.timeOfDay)
      ? payload.timeOfDay
      : 'any',
  }

  return { success: true, quest: sanitized }
}
