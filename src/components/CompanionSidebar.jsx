'use client'

import { useMemo } from 'react'
import {
  Trophy,
  Flame,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Clock,
  Target,
  Zap,
} from 'lucide-react'
import { useQuest } from '../context/QuestContext'
import { scheduledTasks } from '../utils/schedule'
import { isComplete, grantedXp } from '../utils/tasks'
import { currentStreak, bestStreak } from '../utils/stats'
import { levelProgress } from '../utils/xp'
import { fmtClock, fmtMinutes } from '../utils/focus'
import { BADGES } from '../utils/badges'

export default function CompanionSidebar({
  onFinishDay,
  onOpenFocusRoom,
  focusEngine,
  onOpenAchievements,
}) {
  const { state, focusStart, focusPause, focusResume, focusReset } = useQuest()
  const today = scheduledTasks(state.tasks, state.lastActiveDate)

  const doneCount = today.filter(isComplete).length
  const totalCount = today.length
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
  const allDone = totalCount > 0 && doneCount === totalCount

  const streak = currentStreak(state.history, state.lastActiveDate)
  const best = bestStreak(state.history, state.lastActiveDate)
  const { level, current, needed, pct: levelPct } = levelProgress(state.totalXp)

  const earnedBadges = state.badges || {}
  const earnedCount = Object.keys(earnedBadges).length

  // Live Focus engine status
  const focusSession = focusEngine?.session
  const focusRunning = focusEngine?.running
  const focusRemaining = focusEngine?.remaining

  // Focus minutes today
  const todayFocusMins = state.focusSessions
    .filter((f) => f.date === state.lastActiveDate)
    .reduce((s, f) => s + f.minutes, 0)

  // Circular progress math
  const radius = 46
  const circ = 2 * Math.PI * radius
  const strokeDashoffset = circ - (pct / 100) * circ

  return (
    <aside className="space-y-4" aria-label="Productivity Companion">
      {/* 1. Daily Progress & Finish Day Card */}
      <div className="card-aesthetic p-5 text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Daily Quest Goal
          </h3>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            {doneCount}/{totalCount} Done
          </span>
        </div>

        {/* Circular Gauge */}
        <div className="relative mx-auto my-2 flex h-32 w-32 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 108 108">
            <circle
              cx="54"
              cy="54"
              r={radius}
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="9"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="54"
              cy="54"
              r={radius}
              className="text-indigo-600 dark:text-indigo-400 transition-all duration-700 ease-out"
              strokeWidth="9"
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {pct}%
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Complete
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {allDone
            ? '🏆 All quests completed for today!'
            : totalCount === 0
            ? 'No quests scheduled today.'
            : `${totalCount - doneCount} more routine${totalCount - doneCount === 1 ? '' : 's'} to hit 100%!`}
        </p>

        {/* Finish Day Action */}
        <button
          type="button"
          onClick={onFinishDay}
          disabled={totalCount === 0}
          className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 ${
            allDone
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/25 hover:brightness-105'
              : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-slate-900/10 hover:opacity-95'
          } disabled:opacity-40 disabled:pointer-events-none`}
        >
          {allDone ? '🎉 Complete Day (+50 XP Bonus)' : 'Finish Day & Review'}
        </button>
      </div>

      {/* 2. Quick Focus / Pomodoro Hub */}
      <div className="card-aesthetic p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Focus Chamber
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenFocusRoom}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <span>Full View</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 p-3.5 text-center dark:bg-slate-800/60">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            {focusSession ? focusSession.taskName : 'Pomodoro Timer'}
          </p>
          <div className="my-1 font-mono text-3xl font-black text-slate-900 dark:text-white">
            {focusSession ? fmtClock(focusRemaining) : '25:00'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {todayFocusMins > 0 ? `${todayFocusMins}m focused today` : 'Ready for deep focus'}
          </p>

          {/* Controls */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {focusSession ? (
              <>
                <button
                  type="button"
                  onClick={focusRunning ? focusPause : focusResume}
                  className="btn-aesthetic-primary !py-1.5 !px-4 !text-xs"
                >
                  {focusRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{focusRunning ? 'Pause' : 'Resume'}</span>
                </button>
                <button
                  type="button"
                  onClick={focusReset}
                  className="btn-aesthetic-secondary !py-1.5 !px-2.5 !text-xs"
                  title="Reset session"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const defaultTask = today.find((t) => t.type === 'timed') || today[0] || {
                    id: 'quick-focus',
                    name: 'Deep Work',
                    emoji: '🧠',
                  }
                  focusStart(defaultTask, 'pomodoro')
                }}
                className="btn-aesthetic-primary !py-1.5 !px-5 !text-xs"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Start 25m Focus</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Mastery & Level Progress */}
      <div className="card-aesthetic p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mastery Progress
            </h3>
          </div>
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
            Level {level}
          </span>
        </div>

        <div className="flex items-baseline justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{state.totalXp.toLocaleString()} Total XP</span>
          <span className="text-[11px] font-medium text-slate-400">
            {needed - current} XP to Lv {level + 1}
          </span>
        </div>

        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${Math.max(levelPct, 4)}%` }}
          />
        </div>

        {/* Streaks row */}
        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/50">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <Flame className="h-3.5 w-3.5 fill-amber-500" />
              <span className="text-sm font-black">{streak}d</span>
            </div>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">Current Streak</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/50">
            <div className="flex items-center justify-center gap-1 text-orange-500">
              <Trophy className="h-3.5 w-3.5" />
              <span className="text-sm font-black">{best}d</span>
            </div>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">Best Streak</p>
          </div>
        </div>
      </div>

      {/* 4. Mini Trophy Showcase */}
      <div className="card-aesthetic p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Achievements
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenAchievements}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {earnedCount}/{BADGES.length} Unlocked
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {BADGES.slice(0, 5).map((badge) => {
            const has = Boolean(earnedBadges[badge.id])
            return (
              <div
                key={badge.id}
                title={`${badge.name}: ${badge.description}${has ? ' (Earned!)' : ' (Locked)'}`}
                className={`flex h-11 items-center justify-center rounded-xl text-lg transition-transform hover:scale-110 ${
                  has
                    ? 'bg-amber-50 ring-1 ring-amber-500/30 dark:bg-amber-950/40'
                    : 'bg-slate-100 opacity-40 grayscale dark:bg-slate-800'
                }`}
              >
                <span>{has ? badge.emoji : '🔒'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
