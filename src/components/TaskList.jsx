'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Filter, Sparkles, CheckCircle2, Clock, CalendarDays } from 'lucide-react'
import QuestCard from './ui/QuestCard'
import EmptyState from './ui/EmptyState'
import { useQuest } from '../context/QuestContext'
import { scheduledTasks } from '../utils/schedule'
import { isComplete } from '../utils/tasks'
import { todayStr, longLabel } from '../utils/date'

export default function TaskList({ selectedDate, onNewTask, onEditTask, onFocusTask, userName, onRequestDeleteTask }) {
  const { state } = useQuest()
  const [filter, setFilter] = useState('all') // 'all', 'morning', 'afternoon', 'evening', 'active', 'done'
  const [search, setSearch] = useState('')

  const activeDate = selectedDate || state.lastActiveDate
  const isToday = activeDate === state.lastActiveDate

  // All scheduled tasks for the target date
  const scheduled = useMemo(
    () => scheduledTasks(state.tasks, activeDate),
    [state.tasks, activeDate],
  )

  const doneCount = scheduled.filter(isComplete).length
  const totalCount = scheduled.length
  const completionPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0

  // Filter & Search
  const filtered = useMemo(() => {
    return scheduled.filter((t) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase()
        if (!t.name.toLowerCase().includes(query)) return false
      }
      // Filter tab
      if (filter === 'all') return true
      if (filter === 'morning') return t.timeOfDay === 'morning'
      if (filter === 'afternoon') return t.timeOfDay === 'afternoon'
      if (filter === 'evening') return t.timeOfDay === 'evening'
      if (filter === 'active') return !isComplete(t)
      if (filter === 'done') return isComplete(t)
      return true
    })
  }, [scheduled, filter, search])

  const filterTabs = [
    { id: 'all', label: 'All Quests', count: totalCount },
    { id: 'active', label: 'Active', count: totalCount - doneCount },
    { id: 'done', label: 'Completed', count: doneCount },
    { id: 'morning', label: 'Morning' },
    { id: 'afternoon', label: 'Afternoon' },
    { id: 'evening', label: 'Evening' },
  ]

  const pageTitle = isToday ? 'Daily Quests' : `Quests for ${longLabel(activeDate)}`
  const pageDesc = isToday
    ? `${doneCount} of ${totalCount} completed (${completionPct}%) • Keep the momentum going!`
    : 'Viewing historical or planned schedule for this day'
  const perfectBadge = isToday && doneCount === totalCount && totalCount > 0 ? '🎉 Perfect Day!' : null

  return (
    <div className="space-y-4">
      {/* Date Indicator when viewing non-today date */}
      {!isToday && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-50/70 border border-indigo-200/60 px-4 py-2.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-300">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Viewing scheduled quests for {longLabel(activeDate)}</span>
          </div>
          <span className="font-bold">{doneCount}/{totalCount} Completed</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterTabs.map((tab) => {
            const active = filter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`rounded-md px-1.5 py-0.2 text-[10px] font-extrabold ${
                      active
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-56 shrink-0">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quests..."
            className="input-aesthetic !h-8 !py-1 !pl-8 !text-xs"
          />
        </div>
      </div>

      {/* Routine Cards List or Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji={search ? '🔍' : totalCount === 0 ? '🌴' : '✨'}
          title={
            search
              ? 'No matching quests found'
              : totalCount === 0
              ? 'No quests scheduled for this day'
              : 'All filtered quests caught up!'
          }
          description={
            search
              ? 'Try searching with another keyword or clear the search filter.'
              : totalCount === 0
              ? 'Take a well-deserved rest, or create a new routine to conquer today.'
              : 'Great job! Check other filters or relax for the day.'
          }
          action={
            totalCount === 0 || search
              ? {
                  label: 'Add a Quest',
                  onClick: onNewTask,
                  icon: Plus,
                }
              : null
          }
        />
      ) : (
        <div className="stagger space-y-3">
          {filtered.map((task) => (
            <QuestCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onFocus={onFocusTask}
              onRequestDelete={onRequestDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}
