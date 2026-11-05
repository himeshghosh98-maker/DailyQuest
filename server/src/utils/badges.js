import { isComplete } from './tasks.js'

/**
 * Badge catalogue — port of frontend utils/badges.js so server-side
 * evaluation stays consistent with what the UI shows.
 * helpers: { streak (current incl. today), level, perfectDays }
 */

/** How many times a task with this name has ever been completed. */
export function completionsByName(state, name) {
  const needle = name.toLowerCase()
  let count = (state.tasks || []).filter((t) => t.name?.toLowerCase() === needle && t.done).length
  for (const h of state.history || []) {
    count += (h.tasks || []).filter((t) => t.name?.toLowerCase() === needle && t.done).length
  }
  return count
}

/** All-time perfect days from history. */
export function perfectDaysCount(history) {
  return (history || []).filter((h) => h.perfect).length
}

export const BADGES = [
  {
    id: 'first-step',
    emoji: '🌱',
    name: 'First Step',
    description: 'Complete your first quest',
    check: (state) =>
      (state.tasks || []).some((t) => isComplete(t)) ||
      (state.history || []).some((h) => (h.tasks || []).some((t) => t.done)),
  },
  {
    id: 'perfect-day',
    emoji: '🌟',
    name: 'Perfect Day',
    description: 'Finish a day with every quest done',
    check: (state) =>
      ((state.tasks || []).length > 0 && (state.tasks || []).every((t) => isComplete(t))) ||
      (state.history || []).some((h) => h.perfect),
  },
  {
    id: 'streak-3',
    emoji: '🔥',
    name: 'On Fire',
    description: '3-day streak (80%+ completion)',
    check: (state, { streak }) => streak >= 3,
  },
  {
    id: 'streak-7',
    emoji: '🗓️',
    name: '7-Day Streak',
    description: 'A full week of discipline',
    check: (state, { streak }) => streak >= 7,
  },
  {
    id: 'gym-rat',
    emoji: '💪',
    name: 'Gym Rat',
    description: 'Complete "Gym" 10 times',
    check: (state) => completionsByName(state, 'gym') >= 10,
  },
  {
    id: 'night-owl',
    emoji: '🦉',
    name: 'Night Owl',
    description: 'Complete a quest after 11 PM',
    check: (state) => new Date().getHours() >= 23 && (state.tasks || []).some((t) => isComplete(t)),
  },
  {
    id: 'early-bird',
    emoji: '🌅',
    name: 'Early Bird',
    description: 'Complete a quest before 7 AM',
    check: (state) => new Date().getHours() < 7 && (state.tasks || []).some((t) => isComplete(t)),
  },
  {
    id: 'scholar',
    emoji: '📚',
    name: 'Scholar',
    description: 'Complete "Study" 10 times',
    check: (state) => completionsByName(state, 'study') >= 10,
  },
  {
    id: 'level-5',
    emoji: '🚀',
    name: 'Rising Star',
    description: 'Reach level 5',
    check: (state, { level }) => level >= 5,
  },
  {
    id: 'perfect-5',
    emoji: '👑',
    name: 'Perfectionist',
    description: 'Five perfect days',
    check: (state, { perfectDays }) => perfectDays >= 5,
  },
]

/** Badge ids currently earned according to the checks (not the stored set). */
export function earnedBadgeIds(state, helpers) {
  return BADGES.filter((b) => b.check(state, helpers)).map((b) => b.id)
}
