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
  Download,
  Search,
  Filter,
  ArrowUpDown,
  History,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Heatmap from './Heatmap'
import { useQuest } from '../context/QuestContext'
import { bestStreak, currentStreak } from '../utils/stats'
import { buildDayMap, lifetimeStats } from '../utils/analytics'
import { scheduledTasks } from '../utils/schedule'
import { isComplete, taskPct, grantedXp } from '../utils/tasks'
import { fmtMinutes } from '../utils/focus'

import PageHeader from './ui/PageHeader'
import StatCard from './ui/StatCard'
import EmptyState from './ui/EmptyState'

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
  const [tableSearch, setTableSearch] = useState('')
  const [tableFilter, setTableFilter] = useState('all') // 'all', 'completed', 'focus'
  const [sortField, setSortField] = useState('date') // 'date', 'xp', 'name'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'

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

  // Unified structured history rows (from daily history tasks & focus sessions)
  const historyRows = useMemo(() => {
    const rows = []

    // 1. History tasks
    state.history.forEach((dayRecord) => {
      if (Array.isArray(dayRecord.tasks)) {
        dayRecord.tasks.forEach((t, i) => {
          rows.push({
            id: `task-${dayRecord.date}-${t.name}-${i}`,
            date: dayRecord.date,
            name: t.name,
            emoji: t.emoji || '✨',
            type: 'Quest',
            subType: t.type || 'yesno',
            duration: t.type === 'timed' ? `${t.target || 25}m` : t.type === 'count' ? `${t.target || 1}x` : '1x',
            xp: t.xp || 10,
            status: t.done ? 'completed' : 'missed',
          })
        })
      }
    })

    // 2. Focus sessions
    state.focusSessions.forEach((f, i) => {
      rows.push({
        id: `focus-${f.id || i}`,
        date: f.date || state.lastActiveDate,
        name: f.taskName || 'Deep Work Focus',
        emoji: f.taskEmoji || '⏱️',
        type: 'Focus',
        subType: 'Pomodoro',
        duration: `${f.minutes || 25}m`,
        xp: Math.round((f.minutes || 25) * 1.2),
        status: 'completed',
      })
    })

    return rows
  }, [state.history, state.focusSessions, state.lastActiveDate])

  // Filtered and sorted rows
  const filteredRows = useMemo(() => {
    return historyRows
      .filter((r) => {
        if (tableSearch.trim()) {
          const q = tableSearch.toLowerCase()
          if (!r.name.toLowerCase().includes(q) && !r.date.includes(q)) return false
        }
        if (tableFilter === 'completed') return r.status === 'completed'
        if (tableFilter === 'focus') return r.type === 'Focus'
        return true
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortField === 'date') cmp = a.date.localeCompare(b.date)
        else if (sortField === 'xp') cmp = a.xp - b.xp
        else if (sortField === 'name') cmp = a.name.localeCompare(b.name)
        return sortOrder === 'desc' ? -cmp : cmp
      })
  }, [historyRows, tableSearch, tableFilter, sortField, sortOrder])

  function handleExportCsv() {
    try {
      const headers = ['Date', 'Activity', 'Type', 'Duration', 'XP', 'Status']
      const csvRows = [headers.join(',')]

      historyRows.forEach((r) => {
        csvRows.push(
          [
            `"${r.date}"`,
            `"${r.emoji} ${r.name}"`,
            `"${r.type}"`,
            `"${r.duration}"`,
            r.xp,
            `"${r.status}"`,
          ].join(',')
        )
      })

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `dailyquest-history-${state.lastActiveDate}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Activity history exported to CSV!')
    } catch {
      toast.error('Could not generate CSV export.')
    }
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Eyebrow and Primary Export Action */}
      <PageHeader
        eyebrow="Analytics / Performance"
        title="Analytics & Insights"
        description="Track your habit consistency, level progression, and comprehensive session history."
        action={
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={historyRows.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-indigo-500" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* 2. Top-Level SaaS KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Days Active"
          value={stats.daysLogged || 1}
          icon={Calendar}
          color="text-indigo-600 dark:text-indigo-400"
          bgColor="bg-indigo-50 dark:bg-indigo-950/40"
          subtext="Total tracked days"
          trend={`${stats.daysLogged || 1} Days`}
          trendType="positive"
        />
        <StatCard
          label="Perfect Days"
          value={stats.perfectDays}
          icon={Award}
          color="text-amber-500"
          bgColor="bg-amber-50 dark:bg-amber-950/40"
          subtext="100% completion record"
          trend={stats.perfectDays > 0 ? `${stats.perfectDays} Perfect` : 'In Progress'}
          trendType={stats.perfectDays > 0 ? 'positive' : 'neutral'}
        />
        <StatCard
          label="Best Streak"
          value={`${best}d`}
          icon={Flame}
          color="text-orange-500"
          bgColor="bg-orange-50 dark:bg-orange-950/40"
          subtext={`Current active: ${streak} days`}
          trend={streak >= best && best > 0 ? 'All-time Best' : `${streak}d Current`}
          trendType="positive"
        />
        <StatCard
          label="Total Focus Time"
          value={fmtMinutes(totalFocusMins)}
          icon={Clock}
          color="text-emerald-500"
          bgColor="bg-emerald-50 dark:bg-emerald-950/40"
          subtext={`${state.focusSessions.length} total sessions`}
          trend={`${state.focusSessions.length} logged`}
          trendType="positive"
        />
      </div>

      {/* 3. Activity Heatmap Card */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Consistency Matrix
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
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

      {/* 4. Completion Trends Chart Card */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trajectory Analysis
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
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
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                chartMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setChartMode('weekly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                chartMode === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setChartMode('monthly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                chartMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
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

      {/* 5. Structured SaaS Data Table: Activity & Session History */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Audit Log & History
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <History className="h-4 w-4 text-indigo-500" />
              <span>Activity & Session History</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive log of completed quests, routines, and focus sessions.
            </p>
          </div>

          {/* Table Filters & Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTableFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  tableFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                All ({historyRows.length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('completed')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  tableFilter === 'completed'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('focus')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  tableFilter === 'focus'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Focus
              </button>
            </div>

            {/* Search Input */}
            <div className="relative sm:w-48">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search history..."
                className="w-full h-8 rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Structured Table */}
        {filteredRows.length === 0 ? (
          <EmptyState
            emoji="📜"
            title="No activity records found"
            description={
              tableSearch
                ? 'No sessions matched your search term.'
                : 'Conquer quests or complete focus sessions to build your permanent record.'
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th
                    scope="col"
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Activity</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-4">Type</th>
                  <th scope="col" className="py-3 px-4 text-right">Duration / Target</th>
                  <th
                    scope="col"
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    onClick={() => toggleSort('xp')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>XP Granted</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredRows.slice(0, 50).map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {row.date}
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{row.emoji}</span>
                        <span className="truncate max-w-[200px] sm:max-w-xs">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-300 font-mono">
                      {row.duration}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums font-bold text-amber-600 dark:text-amber-400 font-mono">
                      +{row.xp} XP
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {row.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                          <Check className="h-3 w-3" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <span>Missed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Routine Consistency Breakdown */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Individual Habit Rankings
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 mt-0.5">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          <span>Routine Consistency Breakdown</span>
        </h2>

        {stats.taskStats.length === 0 ? (
          <EmptyState
            emoji="📊"
            title="No habit history recorded yet"
            description="Complete your routines over time to unlock breakdown statistics and completion rankings."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.taskStats.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-800/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{item.emoji}</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {item.rate}%
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${Math.max(item.rate, 4)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>{item.done} completed</span>
                  <span className="text-right">{item.opportunities} scheduled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
