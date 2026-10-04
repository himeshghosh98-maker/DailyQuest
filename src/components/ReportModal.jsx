'use client'

import Modal from './ui/Modal'
import { useQuest } from '../context/QuestContext'
import { longLabel } from '../utils/date'
import { gradeFor, GRADE_META } from '../utils/grades'
import { currentStreak } from '../utils/stats'
import { scheduledTasks } from '../utils/schedule'
import { grantedXp, isComplete, taskPct } from '../utils/tasks'
import { fmtMinutes } from '../utils/focus'
import { Sparkles, Trophy, Flame, CheckCircle2, Clock, X } from 'lucide-react'

function StatCard({ value, label, icon: Icon, color = 'text-indigo-600' }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-center dark:border-slate-800 dark:bg-slate-800/40">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {Icon && <Icon className={`h-4 w-4 ${color}`} />}
        <span className={`text-xl font-black ${color}`}>{value}</span>
      </div>
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

export default function ReportModal({ open, onClose }) {
  const { state, finishDay } = useQuest()
  const date = state.lastActiveDate

  const today = scheduledTasks(state.tasks, state.lastActiveDate)
  const total = today.length
  const done = today.filter(isComplete)
  const live = {
    completedCount: done.length,
    totalCount: total,
    completionPct: total ? Math.round(today.reduce((s, t) => s + taskPct(t), 0) / total) : 0,
    xpEarned: today.reduce((s, t) => s + grantedXp(t), 0),
  }

  const saved = state.history.find((h) => h.date === date)
  const matchesSaved = saved && saved.completedCount === live.completedCount && saved.totalCount === total

  const report = matchesSaved ? saved : live
  const grade = matchesSaved ? saved.grade : gradeFor(report.completionPct)
  const meta = GRADE_META[grade] ?? GRADE_META.D
  const missed = (matchesSaved ? saved.tasks : today).filter((t) => !t.done)

  const historyForStreak = matchesSaved
    ? state.history
    : [...state.history.filter((h) => h.date !== date), { date, completionPct: report.completionPct }]
  const streak = currentStreak(historyForStreak, date)

  const focusToday = state.focusSessions.filter((f) => f.date === date)
  const focusMins = focusToday.reduce((s, f) => s + f.minutes, 0)

  function handleConfirmFinish() {
    finishDay()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="report-title">
      <div className="space-y-5 text-center">
        {/* Header */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {longLabel(date)}
          </span>
          <h2 id="report-title" className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            Day Summary & Review
          </h2>
        </div>

        {/* Grade Badge Hero */}
        <div className="relative mx-auto my-3 flex flex-col items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-4xl font-black text-white shadow-xl shadow-indigo-500/30">
            {grade}
          </div>
          <p className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
            {meta.headline || 'Great effort!'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-0.5">
            {meta.motivate || 'Every finished quest brings you closer to your ultimate potential.'}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatCard
            icon={CheckCircle2}
            value={`${report.completedCount}/${report.totalCount}`}
            label="Quests Done"
            color="text-emerald-500"
          />
          <StatCard
            icon={Sparkles}
            value={`${report.completionPct}%`}
            label="Completion Rate"
            color="text-indigo-600"
          />
          <StatCard
            icon={Trophy}
            value={`+${report.xpEarned}`}
            label="XP Gained"
            color="text-amber-500"
          />
          <StatCard
            icon={Flame}
            value={`${streak}d`}
            label="Streak"
            color="text-orange-500"
          />
        </div>

        {/* Focus Stats for the day */}
        {focusMins > 0 && (
          <div className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:bg-slate-800/40 dark:text-slate-300 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>{fmtMinutes(focusMins)} of focused deep work logged today</span>
          </div>
        )}

        {/* Missed tasks note if any */}
        {missed.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Uncompleted quests ({missed.length}):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missed.map((t, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-300"
                >
                  {t.emoji} {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirmFinish}
            className="btn-aesthetic-primary w-full !py-3 !text-sm"
          >
            {report.completedCount === report.totalCount && report.totalCount > 0
              ? '🎉 Claim Bonus & Complete Day'
              : 'Save & Finish Day'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
