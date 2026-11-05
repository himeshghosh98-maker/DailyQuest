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
  Clock,
  Sparkles,
  Flame,
  Timer,
} from 'lucide-react'
import { useQuest } from '../../context/QuestContext'
import { useModals } from '../../context/ModalContext'
import { toast } from 'sonner'
import { grantedXp, isComplete, targetOf, taskPct } from '../../utils/tasks'
import { TOD_LABELS, REPEAT_LABELS } from '../../constants'

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

export default function QuestCard({ task, onEdit, onFocus, onRequestDelete }) {
  const { state, toggleTask, deleteTask, setProgress, setMinutes, startTimer, stopTimer } =
    useQuest()
  const { confirmAction } = useModals()
  const [xpFloats, setXpFloats] = useState([])

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
      toast.success(`Quest completed: ${task.name}! (+${task.xp} XP)`)
    } else {
      toast.info(`Quest marked incomplete`)
    }
  }

  function handleStep(delta) {
    const before = grantedXp(task)
    const current = task.progress || 0
    const next = Math.min(target, Math.max(0, current + delta))
    setProgress(task.id, next)
    const gain = (next === target ? task.xp : 0) - before
    if (gain > 0) {
      triggerXpFloat(gain)
      toast.success(`Target reached: ${task.name}! (+${gain} XP)`)
    }
  }

  function handleToggleTimer() {
    if (running) {
      stopTimer(task.id)
      toast.info(`Timer paused for ${task.name}`)
    } else {
      startTimer(task.id)
      toast.info(`Timer started for ${task.name}`)
    }
  }

  function handleDeleteClick() {
    if (onRequestDelete) {
      onRequestDelete(task)
    } else {
      confirmAction({
        title: 'Delete Quest?',
        description: `Are you sure you want to delete "${task.name}"? This action cannot be undone.`,
        confirmText: 'Delete Quest',
        danger: true,
        onConfirm: () => {
          deleteTask(task.id)
          toast.info(`Quest "${task.name}" deleted`)
        },
      })
    }
  }

  return (
    <div
      className={`card-aesthetic group relative p-4 transition-all duration-200 ${
        complete
          ? 'bg-slate-50/70 border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-800/40'
          : 'hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Floating XP Numbers */}
      <div className="pointer-events-none absolute right-6 top-2 z-20 flex flex-col items-end">
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

      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Emoji Avatar */}
        <div
          className={`flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm transition-transform duration-200 group-hover:scale-105 ${
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
                  ? 'text-slate-400 line-through dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.name}
            </h3>

            {/* Actions Menu */}
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  aria-label="Edit quest"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleDeleteClick}
                aria-label="Delete quest"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Badges / Meta Strip */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {/* XP Value */}
            <span className="badge-pill bg-amber-50 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30">
              +{task.xp} XP
            </span>

            {/* Repeat rule */}
            {task.repeat && task.repeat !== 'daily' && (
              <span className="badge-pill bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {REPEAT_LABELS[task.repeat] || task.repeat}
              </span>
            )}

            {/* Time of Day */}
            {task.timeOfDay && task.timeOfDay !== 'any' && (
              <span className="badge-pill bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {TOD_LABELS[task.timeOfDay] || task.timeOfDay}
              </span>
            )}

            {/* Streak */}
            {streak > 1 && (
              <span className="badge-pill bg-orange-50 text-orange-700 ring-1 ring-orange-500/20 dark:bg-orange-950/40 dark:text-orange-300">
                <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                <span>{streak}d</span>
              </span>
            )}
          </div>

          {/* Interactive Controls per Task Type */}
          <div className="mt-3 flex items-center justify-between gap-3">
            {/* Type 1: Yes/No Simple Checkbox */}
            {task.type === 'yesno' && (
              <button
                type="button"
                onClick={handleCheck}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                  complete
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-md border ${
                    complete
                      ? 'border-white bg-white/20'
                      : 'border-slate-400 dark:border-slate-500'
                  }`}
                >
                  {complete && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <span>{complete ? 'Completed' : 'Complete Quest'}</span>
              </button>
            )}

            {/* Type 2: Count Progress */}
            {task.type === 'count' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-850">
                  <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    disabled={(task.progress || 0) <= 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 text-xs font-black text-slate-900 dark:text-white">
                    {task.progress || 0} / {target} {task.unit || 'times'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    disabled={(task.progress || 0) >= target}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Type 3: Timed Progress */}
            {task.type === 'timed' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
                    running
                      ? 'bg-amber-500 text-white animate-pulse'
                      : complete
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>
                    {task.minutes || 0} / {target} min
                  </span>
                </button>
              </div>
            )}

            {/* Quick Focus Button */}
            {onFocus && (
              <button
                type="button"
                onClick={() => onFocus(task)}
                title="Open in Focus Chamber"
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              >
                <Timer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Focus</span>
              </button>
            )}
          </div>

          {/* Progress Bar (for count / timed) */}
          {task.type !== 'yesno' && (
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  complete
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
