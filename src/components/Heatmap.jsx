import { useMemo } from 'react'
import { addDays, toDateStr, todayStr } from '../utils/date'

/** Warm color for a completion percentage (Tailwind-safe literals). */
function cellClass(pct) {
  if (pct == null) return 'bg-linen/70 dark:bg-white/5'
  if (pct === 0) return 'bg-linen dark:bg-white/10'
  if (pct < 40) return 'bg-peach dark:bg-peach/40'
  if (pct < 60) return 'bg-orange-200 dark:bg-orange-300/40'
  if (pct < 80) return 'bg-orange-300 dark:bg-orange-400/50'
  if (pct < 100) return 'bg-tangerine/80 dark:bg-tangerine/70'
  return 'bg-tangerine dark:bg-tangerine'
}

/**
 * GitHub-style calendar heatmap for the last `weeks` weeks.
 * Columns are weeks, rows are weekdays (Mon top, Sun bottom).
 */
export default function Heatmap({ history, liveToday, weeks = 18 }) {
  const grid = useMemo(() => {
    const map = new Map()
    for (const h of history) map.set(h.date, h.completionPct)
    if (liveToday && liveToday.totalCount > 0) {
      map.set(liveToday.date, liveToday.completionPct)
    }

    const today = todayStr()
    const todayDate = new Date()
    const cols = []
    // Build columns of 7 days ending today, then reverse to chronological.
    for (let w = weeks - 1; w >= 0; w--) {
      const days = []
      for (let d = 6; d >= 0; d--) {
        const offset = -(w * 7 + d)
        const dt = new Date(todayDate)
        dt.setDate(dt.getDate() + offset)
        const dateStr = toDateStr(dt)
        days.push({
          date: dateStr,
          pct: map.has(dateStr) ? map.get(dateStr) : null,
          future: dateStr > today,
          isToday: dateStr === today,
        })
      }
      cols.push(days)
    }
    return cols
  }, [history, liveToday, weeks])

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-1">
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={
                  day.future
                    ? undefined
                    : `${day.date}${day.pct != null ? ` — ${day.pct}% complete` : ' — no data'}`
                }
                className={`h-4 w-4 rounded-[5px] ${cellClass(day.pct)} ${
                  day.future ? 'opacity-25' : ''
                } ${day.isToday ? 'ring-2 ring-charcoal ring-offset-2 ring-offset-white dark:ring-offset-bark' : ''} transition-transform hover:scale-125`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-ink-soft">
        <span>Less</span>
        {[null, 20, 50, 70, 90, 100].map((p, i) => (
          <div key={i} className={`h-3 w-3 rounded-[3px] ${cellClass(p)}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
