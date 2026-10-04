import { useEffect } from 'react'
import { useQuest } from '../context/QuestContext'
import { todayStr } from '../utils/date'

/**
 * Optional daily reminder via the Notifications API.
 * Fires once per day, at or after the configured HH:MM, when quests remain.
 */
export default function useReminder() {
  const { state, setSettings } = useQuest()
  const { notifEnabled, notifTime, notifLastShown } = state.settings

  useEffect(() => {
    if (!notifEnabled) return
    if (typeof Notification === 'undefined') return

    function check() {
      if (Notification.permission !== 'granted') return
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      const [h, m] = (notifTime || '20:00').split(':').map(Number)
      const target = (h || 20) * 60 + (m || 0)
      if (nowMin < target) return
      if (notifLastShown === todayStr()) return

      const remaining = state.tasks.filter((t) => !t.done).length
      const body =
        remaining > 0
          ? `${remaining} quest${remaining === 1 ? '' : 's'} still waiting. Your XP awaits, hero! ⚔️`
          : 'All quests complete — legendary! 🎉'
      try {
        new Notification('DailyQuest', { body })
        setSettings({ notifLastShown: todayStr() })
      } catch {
        /* some browsers restrict constructions; ignore */
      }
    }

    check()
    const timer = setInterval(check, 30_000)
    return () => clearInterval(timer)
  }, [notifEnabled, notifTime, notifLastShown, state.tasks, setSettings])
}
