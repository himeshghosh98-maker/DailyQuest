'use client'

import { DAY_NAMES, DAY_LETTERS } from '../constants'
import { useQuest } from '../context/QuestContext'
import { isScheduledOn } from '../utils/schedule'
import { isComplete } from '../utils/tasks'
import { Check, Calendar } from 'lucide-react'

export default function DayStrip({ selectedDate, onSelectDate }) {
  const { state } = useQuest()
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))

  const activeDate = selectedDate || state.lastActiveDate

  const days = DAY_NAMES.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    
    // Scheduled tasks on that date
    const scheduled = state.tasks.filter((t) => isScheduledOn(t, dateStr))
    
    // Historical completion or live completion for today
    let completedCount = 0
    let isPast = dateStr < state.lastActiveDate
    let isToday = dateStr === state.lastActiveDate

    if (isToday) {
      completedCount = scheduled.filter(isComplete).length
    } else {
      const hist = state.history.find((h) => h.date === dateStr)
      if (hist) {
        completedCount = hist.completedCount || 0
      }
    }

    const allDone = scheduled.length > 0 && completedCount === scheduled.length

    return {
      label,
      letter: DAY_LETTERS[i],
      dateNum: d.getDate(),
      dateStr,
      isToday,
      isPast,
      scheduledCount: scheduled.length,
      completedCount,
      allDone,
    }
  })

  return (
    <div className="card-aesthetic p-4 sm:p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Weekly Schedule
          </h3>
        </div>
        {selectedDate && selectedDate !== state.lastActiveDate && (
          <button
            onClick={() => onSelectDate(state.lastActiveDate)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
          >
            ← Back to Today
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {days.map((d) => {
          const isSelected = d.dateStr === activeDate

          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => onSelectDate && onSelectDate(d.dateStr)}
              className={`group relative flex flex-col items-center justify-between rounded-xl py-2.5 sm:py-3 px-1 transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/30 scale-[1.02]'
                  : d.isToday
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {/* Day Name */}
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isSelected
                    ? 'text-indigo-100'
                    : d.isToday
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {d.label}
              </span>

              {/* Day Number */}
              <span
                className={`my-1 text-base sm:text-lg font-black leading-none ${
                  isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {d.dateNum}
              </span>

              {/* Status / Dots */}
              <div className="flex h-3.5 items-center justify-center gap-0.5">
                {d.allDone ? (
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] ${
                      isSelected
                        ? 'bg-white text-indigo-700'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                ) : (
                  Array.from({ length: Math.min(3, d.scheduledCount) }, (_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        isSelected
                          ? 'bg-indigo-200'
                          : idx < d.completedCount
                          ? 'bg-emerald-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  ))
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
