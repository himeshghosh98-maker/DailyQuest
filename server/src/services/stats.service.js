import { BADGE_XP, STREAK_THRESHOLD } from '../config/constants.js'
import { todayStr } from '../utils/date.js'
import { gradeFor } from '../utils/grades.js'
import { currentStreak, bestStreak } from '../utils/stats.js'
import { scheduledTasks } from '../utils/schedule.js'
import { grantedXp, isComplete, taskPct } from '../utils/tasks.js'
import { levelProgress } from '../utils/xp.js'
import { BADGES, perfectDaysCount } from '../utils/badges.js'
import { getState } from './state.service.js'

/** Helpers shared by badge checks (same inputs the frontend passes). */
export function badgeHelpers(state) {
  return {
    streak: currentStreak(state.history || [], state.lastActiveDate || todayStr()),
    level: levelProgress(state.totalXp || 0).level,
    perfectDays: perfectDaysCount(state.history || []),
  }
}

/** Today's live day summary — same math as the frontend's finishDay(). */
export function todaySummary(state) {
  const date = state.lastActiveDate || todayStr()
  const dayTasks = scheduledTasks(state.tasks || [], date)
  const done = dayTasks.filter(isComplete)
  const pct =
    dayTasks.length > 0
      ? Math.round(dayTasks.reduce((s, t) => s + taskPct(t), 0) / dayTasks.length)
      : 0
  const xpEarned = (state.tasks || []).reduce((sum, t) => sum + grantedXp(t), 0)
  return {
    date,
    completedCount: done.length,
    totalCount: dayTasks.length,
    completionPct: pct,
    xpEarned,
    grade: gradeFor(pct),
    perfect: dayTasks.length > 0 && done.length === dayTasks.length,
  }
}

/**
 * GET /api/v1/stats — XP/levels/streaks/badges computed server-side in the
 * shapes the existing UI components already expect (levelProgress(),
 * currentStreak(), bestStreak(), BADGES catalogue).
 */
export async function summary(userId) {
  const state = await getState(userId)
  const helpers = badgeHelpers(state)
  const level = levelProgress(state.totalXp || 0)
  const earned = new Set(Object.keys(state.badges || {}))

  return {
    totalXp: state.totalXp,
    level, // { level, current, needed, pct }
    streak: {
      current: currentStreak(state.history || [], state.lastActiveDate || todayStr()),
      best: bestStreak(state.history || []),
      threshold: STREAK_THRESHOLD,
    },
    badges: {
      earned: state.badges || {},
      earnedIds: [...earned],
      catalog: BADGES.map((b) => ({
        id: b.id,
        emoji: b.emoji,
        name: b.name,
        description: b.description,
        earned: earned.has(b.id),
      })),
      count: earned.size,
      total: BADGES.length,
      xpEach: BADGE_XP,
      // Ids that would newly qualify right now (clients use for toasts).
      eligible: BADGES.filter((b) => !earned.has(b.id) && b.check(state, helpers)).map((b) => b.id),
    },
    today: todaySummary(state),
  }
}
