'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Filter, Sparkles, CheckCircle2, Clock, CalendarDays } from 'lucide-react'
import TaskItem from './TaskItem'
import { useQuest } from '../context/QuestContext'
import { scheduledTasks } from '../utils/schedule'
import { isComplete } from '../utils/tasks'
import { todayStr, longLabel } from '../utils/date'

export default function TaskList({ selectedDate, onNewTask, onEditTask, onFocusTask, userName }) {
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

  return (
    <div className="space-y-4">
      {/* Header & Greeting Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isToday ? `Daily Quests` : `Quests for ${longLabel(activeDate)}`}
            </h1>
            {isToday && doneCount === totalCount && totalCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                🎉 Perfect Day!
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {isToday
              ? `${doneCount} of ${totalCount} completed (${completionPct}%) • Keep the momentum going!`
              : `Viewing historical or planned schedule for this day`}
          </p>
        </div>

        {/* Action: Add Quest */}
        <button
          type="button"
          onClick={onNewTask}
          className="btn-aesthetic-primary"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Quest</span>
        </button>
      </div>

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

      {/* Routine Cards List */}
      {filtered.length === 0 ? (
        <div className="card-aesthetic flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            {search ? '🔍' : totalCount === 0 ? '🌴' : '✨'}
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {search
              ? 'No matching quests found'
              : totalCount === 0
              ? 'No quests scheduled for this day'
              : 'All filtered quests caught up!'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            {search
              ? 'Try searching with another keyword or clear the search filter.'
              : totalCount === 0
              ? 'Take a well-deserved rest, or create a new routine to conquer today.'
              : 'Great job! Check other filters or relax for the day.'}
          </p>
          <button
            type="button"
            onClick={onNewTask}
            className="btn-aesthetic-secondary mt-4 !py-1.5 !text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add a Quest</span>
          </button>
        </div>
      ) : (
        <div className="stagger space-y-3">
          {filtered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onFocus={onFocusTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}
