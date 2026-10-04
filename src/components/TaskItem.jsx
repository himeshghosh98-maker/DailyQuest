'use client'

import { useEffect, useState } from 'react'
import {
  Check,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Timer,
  Flame,
  Clock,
  Sparkles,
  MoreVertical,
} from 'lucide-react'
import { useQuest } from '../context/QuestContext'
import { grantedXp, isComplete, targetOf, taskPct } from '../utils/tasks'
import { TOD_LABELS, REPEAT_LABELS } from '../constants'

/** Per-task streak: consecutive scheduled days this task was completed */
function taskStreak(history, name, today) {
  if (!history || !Array.isArray(history)) return 0
  const byDate = new Map(history.map((h) => [h.date, h.tasks || []]))
  let n = 0
  let cursor = today
  const hit = (date) => (byDate.get(date) || []).some((t) => t.name === name && t.done)
  while (hit(cursor)) {
    n++
    const [y, m, d] = cursor.split('-').map(Number)
    const prev = new Date(y, m - 1, d - 1)
    cursor = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
  }
  return n
}

export default function TaskItem({ task, onEdit, onFocus }) {
  const { state, toggleTask, deleteTask, setProgress, setMinutes, startTimer, stopTimer } =
    useQuest()
  const [xpFloats, setXpFloats] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)

  const target = targetOf(task)
  const complete = isComplete(task)
  const running = Boolean(task.timer)
  const pct = taskPct(task)
  const streak = taskStreak(state.history, task.name, state.lastActiveDate)

  // Floating +XP animation
  function triggerXpFloat(amount) {
    const id = `${task.id}-${Date.now()}`
    setXpFloats((prev) => [...prev, { id, amount }])
    setTimeout(() => {
      setXpFloats((prev) => prev.filter((x) => x.id !== id))
    }, 1000)
  }

  function handleCheck() {
    const was = isComplete(task)
    toggleTask(task.id)
    if (!was) {
      triggerXpFloat(task.xp)
    }
  }

  function handleStep(delta) {
    const before = grantedXp(task)
    const current = task.progress || 0
    const next = Math.min(target, Math.max(0, current + delta))
    setProgress(task.id, next)
    const afterXp = (next >= target ? task.xp : Math.floor((next / target) * task.xp))
    if (afterXp > before) {
      triggerXpFloat(afterXp - before)
    }
  }

  function handleAddMinutes(mins) {
    const before = grantedXp(task)
    const current = task.minutes || 0
    const next = Math.max(0, current + mins)
    setMinutes(task.id, next)
    const afterXp = (next >= target ? task.xp : Math.floor((next / target) * task.xp))
    if (afterXp > before) {
      triggerXpFloat(afterXp - before)
    }
  }

  return (
    <div
      className={`group relative card-aesthetic p-4 sm:p-5 transition-all duration-200 ${
        complete
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-emerald-500/30 dark:border-emerald-500/20'
          : 'hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Floating XP toasts */}
      <div className="pointer-events-none absolute right-6 top-2 z-30">
        {xpFloats.map((f) => (
          <div
            key={f.id}
            className="animate-float-xp flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-white shadow-lg shadow-amber-500/40"
          >
            <Sparkles className="h-3 w-3" />
            <span>+{f.amount} XP</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-4">
        {/* Emoji Avatar */}
        <div
          className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm transition-transform duration-200 group-hover:scale-105 ${
            complete
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
          }`}
        >
          {task.emoji || '✨'}
        </div>

        {/* Content Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`text-base font-bold tracking-tight truncate ${
                complete
                  ? 'text-slate-500 line-through dark:text-slate-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.name}
            </h3>

            {/* Actions Menu */}
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label="Edit routine"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                aria-label="Delete routine"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Badges / Chips Row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {/* XP Value */}
            <span className="badge-pill bg-amber-50 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30">
              <Sparkles className="h-3 w-3 text-amber-500" />
              +{task.xp} XP
            </span>

            {/* Repeat rule */}
            <span className="badge-pill bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {REPEAT_LABELS[task.repeat] || 'Daily'}
            </span>

            {/* Time of day */}
            {task.timeOfDay && task.timeOfDay !== 'any' && (
              <span className="badge-pill bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Clock className="h-3 w-3" />
                {TOD_LABELS[task.timeOfDay]}
              </span>
            )}

            {/* Streak */}
            {streak > 0 && (
              <span className="badge-pill bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />
                {streak}d
              </span>
            )}
          </div>

          {/* Progress row for Count or Timed */}
          {(task.type === 'count' || task.type === 'timed') && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                <span>
                  {task.type === 'count'
                    ? `${task.progress || 0} of ${target} ${task.unit || 'times'}`
                    : `${task.minutes || 0} of ${target} min`}
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {pct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    complete ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(pct > 0 ? 5 : 0, pct))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Interaction Column */}
        <div className="flex shrink-0 items-center self-center pl-2">
          {/* YES / NO Task: Satisfying Checkbox */}
          {task.type === 'yesno' && (
            <button
              type="button"
              onClick={handleCheck}
              aria-label={complete ? 'Mark incomplete' : 'Mark complete'}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all duration-200 active:scale-90 ${
                complete
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'border-slate-300 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800/80'
              }`}
            >
              {complete && <Check className="h-6 w-6 stroke-[3] animate-pop" />}
            </button>
          )}

          {/* COUNT Task: Stepper [-]  [+] */}
          {task.type === 'count' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={(task.progress || 0) <= 0}
                aria-label="Decrease count"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleStep(1)}
                aria-label="Increase count"
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold shadow-md transition active:scale-95 ${
                  complete
                    ? 'bg-emerald-500 shadow-emerald-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {complete ? <Check className="h-5 w-5 stroke-[2.5]" /> : <Plus className="h-5 w-5" />}
              </button>
            </div>
          )}

          {/* TIMED Task: Quick +5m / +15m + Focus Launcher */}
          {task.type === 'timed' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddMinutes(15)}
                className="hidden sm:inline-flex rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                title="Add 15 minutes"
              >
                +15m
              </button>

              <button
                type="button"
                onClick={() => onFocus(task)}
                aria-label={`Start focus session for ${task.name}`}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span className="hidden sm:inline">Focus</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
