import { useEffect } from 'react'
import { useQuest } from '../context/QuestContext'
import { evaluateBadges, perfectDaysCount } from '../utils/badges'
import { currentStreak } from '../utils/stats'
import { scheduledTasks } from '../utils/schedule'
import { isComplete, taskPct } from '../utils/tasks'
import { levelProgress } from '../utils/xp'

/**
 * Watches tasks/history/XP and awards any newly earned achievements.
 * Awarding adds +BADGE_XP per badge and queues toast notifications.
 */
export default function BadgeWatcher() {
  const { state, awardBadges } = useQuest()

  useEffect(() => {
    // Live perfect-day count includes today's fully-completed scheduled tasks.
    const today = scheduledTasks(state.tasks, state.lastActiveDate)
    const livePerfectToday = today.length > 0 && today.every(isComplete)
    const perfectDays =
      perfectDaysCount(state.history) + (livePerfectToday ? 1 : 0)

    // Live completion % counts partial progress of count/timed tasks.
    const livePct = today.length
      ? Math.round(today.reduce((s, t) => s + taskPct(t), 0) / today.length)
      : 0

    const helpers = {
      streak: currentStreak(
        livePerfectToday
          ? [
              ...state.history.filter((h) => h.date !== state.lastActiveDate),
              { date: state.lastActiveDate, completionPct: livePct },
            ]
          : state.history,
        state.lastActiveDate,
      ),
      level: levelProgress(state.totalXp).level,
      perfectDays,
    }

    const ids = evaluateBadges(state, state.badges || {}, helpers)
    if (ids.length > 0) awardBadges(ids)
    // state is intentionally observed wholesale; awardBadges is stable dispatch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return null
}
