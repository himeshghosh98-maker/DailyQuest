'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Calendar,
  Flame,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
  Check,
} from 'lucide-react'
import Heatmap from './Heatmap'
import { useQuest } from '../context/QuestContext'
import { bestStreak, currentStreak } from '../utils/stats'
import { buildDayMap, lifetimeStats } from '../utils/analytics'
import { scheduledTasks } from '../utils/schedule'
import { isComplete, taskPct, grantedXp } from '../utils/tasks'
import { fmtMinutes } from '../utils/focus'

// Dynamically import Recharts components to prevent SSR hydration mismatches
const DailyTrend = dynamic(() => import('./charts/Trends').then((m) => m.DailyTrend), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />,
})
const WeeklyTrend = dynamic(() => import('./charts/Trends').then((m) => m.WeeklyTrend), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />,
})
const MonthlyTrend = dynamic(() => import('./charts/Trends').then((m) => m.MonthlyTrend), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />,
})

export default function AnalyticsView() {
  const { state } = useQuest()
  const [chartMode, setChartMode] = useState('daily') // 'daily', 'weekly', 'monthly'

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

  const dayMap = useMemo(() => buildDayMap(state.history, liveToday), [state.history, liveToday])
  const stats = useMemo(
    () => lifetimeStats(state.history, state.tasks, dayMap, state.lastActiveDate),
    [state.history, state.tasks, dayMap, state.lastActiveDate],
  )

  const streak = currentStreak(state.history, state.lastActiveDate)
  const best = bestStreak(state.history, state.lastActiveDate)

  // Total Focus Minutes logged
  const totalFocusMins = state.focusSessions.reduce((sum, s) => sum + s.minutes, 0)

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Analytics & Insights
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your habit consistency, level progression, and focus history.
        </p>
      </div>

      {/* 4 Lifetime Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card-aesthetic p-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Days Active</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.daysLogged || 1}
          </p>
          <p className="text-[11px] text-slate-400">Tracked sessions</p>
        </div>

        <div className="card-aesthetic p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Award className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Perfect Days</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.perfectDays}
          </p>
          <p className="text-[11px] text-slate-400">100% completion days</p>
        </div>

        <div className="card-aesthetic p-4">
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <Flame className="h-4 w-4 fill-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Best Streak</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {best} <span className="text-sm font-semibold text-slate-400">days</span>
          </p>
          <p className="text-[11px] text-slate-400">Current: {streak} days</p>
        </div>

        <div className="card-aesthetic p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Focus Time</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {fmtMinutes(totalFocusMins)}
          </p>
          <p className="text-[11px] text-slate-400">{state.focusSessions.length} total sessions</p>
        </div>
      </div>

      {/* Activity Heatmap Card */}
      <div className="card-aesthetic p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>Routine Activity Heatmap</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily habit completion percentage across the last 18 weeks.
            </p>
          </div>
        </div>

        <Heatmap history={state.history} liveToday={liveToday} weeks={18} />
      </div>

      {/* Completion Trends Chart Card */}
      <div className="card-aesthetic p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <span>Performance Trends</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Completion percentage and XP earned over time.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60 self-start sm:self-auto">
            <button
              onClick={() => setChartMode('daily')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                chartMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setChartMode('weekly')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                chartMode === 'weekly'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setChartMode('monthly')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                chartMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-2 min-h-[224px]">
          {chartMode === 'daily' && <DailyTrend history={state.history} liveToday={liveToday} days={30} />}
          {chartMode === 'weekly' && <WeeklyTrend history={state.history} liveToday={liveToday} weeks={8} />}
          {chartMode === 'monthly' && <MonthlyTrend history={state.history} liveToday={liveToday} months={6} />}
        </div>
      </div>

      {/* Routine Breakdown Grid */}
      <div className="card-aesthetic p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          <span>Routine Consistency Breakdown</span>
        </h2>

        {stats.taskStats.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Complete your routines over time to unlock breakdown statistics.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {stats.taskStats.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {item.rate}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${Math.max(item.rate, 4)}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{item.done} completed</span>
                  <span>{item.opportunities} scheduled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
