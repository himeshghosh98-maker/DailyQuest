import { useMemo, useState } from 'react'
import Heatmap from './Heatmap'
import { DailyTrend, WeeklyTrend, MonthlyTrend } from './charts/Trends'
import { useQuest } from '../context/QuestContext'
import { bestStreak, currentStreak } from '../utils/stats'
import { buildDayMap, lifetimeStats } from '../utils/analytics'
import { addDays, shortLabel } from '../utils/date'
import { scheduledTasks } from '../utils/schedule'
import { grantedXp, isComplete, progressLabel, taskPct } from '../utils/tasks'
import { fmtMinutes } from '../utils/focus'
import { BAR_COLORS } from '../constants'

/** Last-7-days focus-minutes bar chart (pure CSS, warm palette). */
function FocusWeek({ sessions, today }) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i)
    const mins = sessions.filter((f) => f.date === date).reduce((s, f) => s + f.minutes, 0)
    days.push({ date, mins, label: shortLabel(date).split(' ')[0] })
  }
  const max = Math.max(30, ...days.map((d) => d.mins))
  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height: 96 }}>
      {days.map((d, i) => (
        <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-[11px] font-extrabold text-ink-soft">{d.mins > 0 ? d.mins : ''}</span>
          <div
            className={`w-full max-w-[34px] rounded-t-lg transition-all duration-700 ${
              i === 6 ? 'bg-tangerine' : 'bg-cocoa/80'
            }`}
            style={{ height: `${Math.max(3, (d.mins / max) * 72)}px` }}
            title={`${d.label}: ${d.mins} min`}
          />
          <span className="text-[11px] font-bold text-ink-soft">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * One tall pill per task: hatched track, colored fill growing from the
 * bottom, completion % inside, task name below.
 */
function TaskPill({ stat, color, delay }) {
  const low = stat.rate < 28
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="hatch-track relative h-48 w-full max-w-[68px] overflow-hidden rounded-full">
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-center rounded-full pb-2.5 transition-all duration-700 ease-out"
          style={{
            height: `${Math.max(stat.rate, 6)}%`,
            backgroundColor: color,
            transitionDelay: `${delay}ms`,
          }}
        >
          {!low && (
            <span className="text-xs font-extrabold text-white">{stat.rate}%</span>
          )}
        </div>
      </div>
      <div className="text-center">
        {low && (
          <span className="block text-xs font-extrabold text-charcoal dark:text-parchment">
            {stat.rate}%
          </span>
        )}
        <span className="mt-0.5 block max-w-[72px] truncate text-[13px] font-bold text-ink-soft">
          {stat.name}
        </span>
      </div>
    </div>
  )
}

/** Milestone 4 history & analytics, in the "progress and insights" style. */
export default function ProgressView() {
  const { state } = useQuest()
  const [shareMsg, setShareMsg] = useState('')

  const today = scheduledTasks(state.tasks, state.lastActiveDate)
  const doneCount = today.filter(isComplete).length
  const liveToday = {
    date: state.lastActiveDate,
    totalCount: today.length,
    completedCount: doneCount,
    completionPct: today.length
      ? Math.round(today.reduce((s, t) => s + taskPct(t), 0) / today.length)
      : 0,
    xpEarned: today.reduce((s, t) => s + grantedXp(t), 0),
  }

  // Focus this week (last 7 days) + today's total.
  const weekFocusMins = state.focusSessions
    .filter((f) => f.date >= addDays(state.lastActiveDate, -6))
    .reduce((s, f) => s + f.minutes, 0)

  const dayMap = buildDayMap(state.history, liveToday)
  const stats = lifetimeStats(state.history, state.tasks, dayMap, state.lastActiveDate)
  const best = bestStreak(state.history)

  // Week-to-date XP + tasks done + time (last 7 days, incl. today).
  const week = useMemo(() => {
    let xp = 0
    let tasks = 0
    let mins = 0
    for (let i = 0; i < 7; i++) {
      const d = dayMap.get(addDays(state.lastActiveDate, -i))
      if (!d) continue
      xp += d.xp
      const entry = i === 0 ? liveToday : state.history.find((h) => h.date === d.date || h.date === addDays(state.lastActiveDate, -i))
      const dayTasks = (i === 0 ? today : entry?.tasks) || []
      tasks += dayTasks.filter((t) => t.done).length
      mins += dayTasks.filter((t) => t.done).reduce((s, t) => {
        // Timed/Count snapshots carry their real durations when present.
        if (t.type === 'timed' && t.target) return s + Math.min(Number(t.target), Number(t.minutes) || Number(t.target))
        return s + Math.max(5, Math.round(t.xp))
      }, 0)
    }
    const h = Math.floor(mins / 60)
    return {
      xp,
      tasks,
      time: h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.history, state.tasks, state.lastActiveDate])

  async function shareProgress() {
    const text = `My DailyQuest progress: ${week.xp} points this week, ${week.tasks} routines done, ${currentStreak(state.history, state.lastActiveDate)}-day streak! 🔥`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'DailyQuest', text })
      } else {
        await navigator.clipboard.writeText(text)
        setShareMsg('Copied to clipboard!')
      }
    } catch {
      /* user cancelled */
      return
    }
    setTimeout(() => setShareMsg(''), 2500)
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-charcoal dark:text-parchment">
          Your progress and insights
        </h1>
      </header>

      {/* Completion pills, one per task */}
      {stats.taskStats.length > 0 && (
        <section aria-label="Task completion" className="card p-5">
          <div className="flex items-start gap-2">
            {stats.taskStats.map((s, i) => (
              <TaskPill
                key={s.name}
                stat={s}
                color={BAR_COLORS[i % BAR_COLORS.length]}
                delay={i * 90}
              />
            ))}
          </div>
          {(stats.mostConsistent || stats.mostSkipped) && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-linen pt-4 text-xs font-bold dark:border-white/10">
              {stats.mostConsistent && (
                <span className="chip bg-mint text-olive-deep dark:bg-mint/20 dark:text-mint">
                  ⭐ Most consistent: {stats.mostConsistent.emoji} {stats.mostConsistent.name}
                </span>
              )}
              {stats.mostSkipped && (
                <span className="chip bg-blush text-cocoa dark:bg-blush/20 dark:text-blossom">
                  😴 Most skipped: {stats.mostSkipped.emoji} {stats.mostSkipped.name}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* Points Earned card */}
      <section aria-label="Points earned" className="card p-5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-charcoal dark:text-parchment">
              Points Earned
            </h2>
            <p className="text-[13px] font-medium text-ink-soft">For this week</p>
          </div>
          <p className="text-[28px] font-extrabold text-tangerine">
            {week.xp.toLocaleString()} <span className="text-[15px] font-bold text-ink-soft">Points</span>
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-linen pt-3 text-center dark:border-white/10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Routines</p>
            <p className="text-xl font-extrabold text-charcoal dark:text-parchment">{week.tasks}</p>
          </div>
          <div className="border-x border-linen dark:border-white/10">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Streak</p>
            <p className="text-xl font-extrabold text-charcoal dark:text-parchment">
              {currentStreak(state.history, state.lastActiveDate)}🔥
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Time</p>
            <p className="text-xl font-extrabold text-charcoal dark:text-parchment">{week.time}</p>
          </div>
        </div>

        <button className="btn btn-accent mt-5 w-full" onClick={shareProgress}>
          Share Progress
        </button>
        {shareMsg && (
          <p className="mt-3 text-center text-[13px] font-bold text-olive-deep dark:text-mint" role="status">
            {shareMsg}
          </p>
        )}
      </section>

      {/* Lifetime stats */}
      <section aria-label="Lifetime stats" className="grid grid-cols-3 gap-2">
        <div className="card p-3.5 text-center">
          <p className="text-xl font-extrabold text-charcoal dark:text-parchment">{best}🔥</p>
          <p className="text-xs font-bold text-ink-soft">Best streak</p>
        </div>
        <div className="card p-3.5 text-center">
          <p className="text-xl font-extrabold text-charcoal dark:text-parchment">{stats.daysLogged}</p>
          <p className="text-xs font-bold text-ink-soft">Days logged</p>
        </div>
        <div className="card p-3.5 text-center">
          <p className="text-xl font-extrabold text-charcoal dark:text-parchment">{stats.perfectDays}</p>
          <p className="text-xs font-bold text-ink-soft">Perfect days</p>
        </div>
      </section>

      {/* Focus time */}
      <section aria-label="Focus time" className="card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-[15px] font-extrabold text-charcoal dark:text-parchment">
            ⏱️ Focus time
          </h3>
          <p className="text-[13px] font-bold text-ink-soft">
            {fmtMinutes(weekFocusMins)} this week
          </p>
        </div>
        <FocusWeek sessions={state.focusSessions} today={state.lastActiveDate} />
      </section>

      {/* Heatmap */}
      <section aria-label="Calendar heatmap" className="card p-4">
        <h3 className="mb-3 text-[15px] font-extrabold text-charcoal dark:text-parchment">
          🔥 Consistency heatmap
        </h3>
        <Heatmap history={state.history} liveToday={liveToday} weeks={18} />
      </section>

      {/* Trends */}
      <section aria-label="Daily trend" className="card p-4">
        <h3 className="mb-3 text-[15px] font-extrabold text-charcoal dark:text-parchment">
          📈 Last 30 days
        </h3>
        <DailyTrend history={state.history} liveToday={liveToday} days={30} />
      </section>

      <section aria-label="Weekly trend" className="card p-4">
        <h3 className="mb-3 text-[15px] font-extrabold text-charcoal dark:text-parchment">
          📅 Weekly view
        </h3>
        <WeeklyTrend history={state.history} liveToday={liveToday} weeks={8} />
      </section>

      <section aria-label="Monthly trend" className="card p-4">
        <h3 className="mb-3 text-[15px] font-extrabold text-charcoal dark:text-parchment">
          🗓️ Monthly view
        </h3>
        <MonthlyTrend history={state.history} liveToday={liveToday} months={6} />
      </section>
    </div>
  )
}
