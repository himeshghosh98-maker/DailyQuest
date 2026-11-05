/**
 * Mirror of the frontend's src/constants.js — the API must agree with what
 * the UI already assumes, so keep these in sync when the app changes.
 */

export const DATA_VERSION = 3

export const TASK_TYPES = ['yesno', 'count', 'timed']
export const REPEAT_MODES = ['daily', 'weekdays', 'weekends', 'custom', 'once']
export const TIME_OF_DAY = ['any', 'morning', 'afternoon', 'evening']
export const FOCUS_MODES = ['pomodoro', 'custom', 'stopwatch']

export const XP_MIN = 5
export const XP_MAX = 200
export const TARGET_MIN = 1
export const TARGET_MAX = 999
export const UNIT_MAX_LEN = 10

export const BONUS_PERFECT_DAY = 50
export const BADGE_XP = 25
export const STREAK_THRESHOLD = 80
export const LEVEL_CAP = 999

/* ===== Focus timer ===== */
export const FOCUS_XP_PER_MIN = 0.2 // 1 XP per 5 minutes
export const FOCUS_COMPLETE_BONUS = 5
export const FOCUS_MAX_PAUSES_FOR_BONUS = 3
export const FOCUS_MIN_MINUTES = 1
export const FOCUS_SESSIONS_MAX = 500
