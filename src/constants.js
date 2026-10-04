export const STORAGE_KEY = 'dailyquest:v1'

/** Data-shape version, bumped when migrateState() learns a new field. */
export const DATA_VERSION = 3

/** Task types: simple checkbox, counted quantity, or minutes with a timer. */
export const TASK_TYPES = ['yesno', 'count', 'timed']
export const TYPE_LABELS = {
  yesno: 'Yes / No',
  count: 'Count',
  timed: 'Timed',
}
export const TYPE_HINTS = {
  yesno: 'Simple check-it-off quest',
  count: 'Hit a daily number (e.g. 8 glasses)',
  timed: 'Reach a daily duration in minutes',
}

/** Repeat rules for scheduling a task onto days. */
export const REPEAT_MODES = ['daily', 'weekdays', 'weekends', 'custom', 'once']
export const REPEAT_LABELS = {
  daily: 'Every day',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  custom: 'Custom',
  once: 'One-time',
}

/** Monday-first day indexes (0 = Mon … 6 = Sun) used by `task.days`. */
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Optional time-of-day tag shown on the task row. */
export const TIME_OF_DAY = ['any', 'morning', 'afternoon', 'evening']
export const TOD_LABELS = {
  any: 'Any time',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

export const DEFAULT_TASKS = [
  { name: 'Coding', emoji: '💻', xp: 30, type: 'yesno' },
  { name: 'Bathing', emoji: '🛁', xp: 10, type: 'yesno' },
  { name: 'Gym', emoji: '💪', xp: 25, type: 'timed', target: 45 },
  { name: 'Study', emoji: '📚', xp: 20, type: 'timed', target: 60 },
  { name: 'Drink water', emoji: '💧', xp: 16, type: 'count', target: 8, unit: 'glasses' },
]

/** Bonus XP awarded by "Finish Day" when every quest is completed (Milestone 3). */
export const BONUS_PERFECT_DAY = 50

/** XP awarded for each newly unlocked achievement. */
export const BADGE_XP = 25

/** Minimum completion % (inclusive) that keeps a streak alive. */
export const STREAK_THRESHOLD = 80

export const LEVEL_CAP = 999

export const EMOJI_CHOICES = [
  '💻', '📚', '💪', '🛁', '🏃', '🧘', '🥗', '💧',
  '😴', '🎸', '🎨', '🙏', '📝', '🧠', '🍎', '✨',
]

export const XP_MIN = 5
export const XP_MAX = 200

/** Bounds for Count targets and Timed daily minute targets. */
export const TARGET_MIN = 1
export const TARGET_MAX = 999
export const UNIT_MAX_LEN = 10

/** Display name + avatar shown in the Home header greeting. */
export const USER_NAME = 'Budi'
export const USER_AVATAR = '🐯'

/** Pastel tile backgrounds cycled across the routine list (index % length). */
export const TILE_BG = ['bg-peach', 'bg-mint', 'bg-blush']

/** Colors for the tall progress pills and charts (warm palette). */
export const BAR_COLORS = ['#5A2E1E', '#A0470F', '#8FA82B', '#E88BC8', '#F97316', '#C98A5B']

/**
 * When true (and the window is >= 768px wide), the app renders inside a
 * realistic phone mockup on desktop; set to false to always render full-screen.
 */
export const SHOW_PHONE_FRAME = true

/* ===== Focus timer ===== */

/** Pomodoro presets (minutes) — editable in Settings. */
export const FOCUS_DEFAULTS = {
  focusMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  sessionsPerLong: 4,
}

export const FOCUS_LIMITS = { focus: [1, 180], brk: [1, 60], sessionsPerLong: [2, 8] }

/** Focus-mode choices for the focus view. */
export const FOCUS_MODES = ['pomodoro', 'custom', 'stopwatch']

/** Quick custom durations (minutes) offered in custom mode. */
export const CUSTOM_DURATIONS = [15, 25, 45, 60, 90]

/** XP per focused minute (whole minutes beyond the first are counted). */
export const FOCUS_XP_PER_MIN = 0.2 // = 1 XP per 5 minutes

/** Bonus XP for finishing a full session without abandoning it. */
export const FOCUS_COMPLETE_BONUS = 5

/** Max pauses before the completion bonus is forfeited. */
export const FOCUS_MAX_PAUSES_FOR_BONUS = 3

/** Sessions shorter than this many minutes log nothing (anti-farm). */
export const FOCUS_MIN_MINUTES = 1

/** Max stored session records (most recent kept). */
export const FOCUS_SESSIONS_MAX = 500
