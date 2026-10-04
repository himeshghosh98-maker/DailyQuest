'use client'

import { useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Clock,
  Target,
  ArrowLeft,
  Coffee,
} from 'lucide-react'
import { useQuest } from '../context/QuestContext'
import { CUSTOM_DURATIONS, FOCUS_MODES } from '../constants'
import {
  durationMs,
  elapsedMs,
  fmtClock,
  fmtMinutes,
  focusedMinutes,
  phaseLabel,
  remainingMs,
  ringFraction,
} from '../utils/focus'

export default function FocusRoom({ focusEngine, onBackToQuests }) {
  const { state, focusStart, focusPause, focusResume, focusReset, focusFinish, focusCancel, setSettings } =
    useQuest()
  const { session, running, now } = focusEngine

  const [selectedTaskId, setSelectedTaskId] = useState(session?.taskId || '')
  const [customMin, setCustomMin] = useState(25)

  const s = state.settings
  const todayTasks = state.tasks

  // If no session exists, pick the first timed task or first general task
  const activeTask =
    state.tasks.find((t) => t.id === (session?.taskId || selectedTaskId)) || {
      id: 'general-focus',
      name: 'General Deep Work',
      emoji: '🧠',
    }

  const remaining = session?.mode === 'stopwatch' ? elapsedMs(session, now) : remainingMs(session, now)
  const frac = ringFraction(session, now)
  const total = durationMs(session, session?.phase || 'focus', state.settings)
  const minsFocused = focusedMinutes(session, now)

  // Focused minutes today
  const todayFocusMins = state.focusSessions
    .filter((f) => f.date === state.lastActiveDate)
    .reduce((s, f) => s + f.minutes, 0)

  // SVG Circular math
  const r = 135
  const circ = 2 * Math.PI * r
  const strokeOffset = circ * (1 - frac)

  function handleStart(mode, customDuration) {
    focusStart(activeTask, mode || 'pomodoro', customDuration || customMin)
  }

  function handleFinish() {
    focusFinish(false)
  }

  function handleCancel() {
    if (minsFocused >= 1 && !window.confirm(`Discard this session? ${minsFocused} min will not be logged.`)) return
    focusCancel()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToQuests}
          className="btn-aesthetic-secondary !py-2 !px-3 text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quests</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => setSettings({ focusSound: !s.focusSound })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            title={s.focusSound ? 'Mute chimes' : 'Unmute chimes'}
          >
            {s.focusSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Main Focus Chamber Card */}
      <div className="card-aesthetic relative overflow-hidden p-6 sm:p-10 text-center">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl animate-pulse-subtle" />
        </div>

        {/* Task Selector & Header */}
        <div className="relative z-10 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">{activeTask.emoji}</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {activeTask.name}
            </h2>
          </div>

          {/* Routine dropdown if not running */}
          {!session && (
            <div className="mt-3">
              <label htmlFor="task-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Focus on a specific routine:
              </label>
              <select
                id="task-select"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="input-aesthetic mt-1 !py-1.5 !text-xs text-center"
              >
                <option value="">🧠 General Deep Work</option>
                {todayTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.emoji} {t.name} ({t.type === 'timed' ? `${t.target}m` : 'Routine'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/60">
            {FOCUS_MODES.map((m) => {
              const active = (session?.mode || 'pomodoro') === m
              const label = m === 'pomodoro' ? '🍅 Pomodoro (25m)' : m === 'custom' ? '⚡ Custom' : '⏱️ Stopwatch'
              return (
                <button
                  key={m}
                  onClick={() => handleStart(m, m === 'custom' ? customMin : undefined)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Custom Duration Presets */}
          {session?.mode === 'custom' && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {CUSTOM_DURATIONS.map((min) => (
                <button
                  key={min}
                  onClick={() => {
                    setCustomMin(min)
                    handleStart('custom', min)
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    (session?.customMin || 25) === min
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {min}m
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Circular Countdown Timer */}
        <div className="relative mx-auto my-8 flex h-72 w-72 sm:h-80 sm:w-80 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 320 320">
            <circle
              cx="160"
              cy="160"
              r={r}
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="160"
              cy="160"
              r={r}
              className="text-indigo-600 dark:text-indigo-400 transition-all duration-300"
              strokeWidth="12"
              strokeDasharray={circ}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
              {session ? fmtClock(remaining) : '25:00'}
            </span>
            <span className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              {session ? `${phaseLabel(session.phase)} Phase` : 'Ready to Start'}
            </span>
            {session && session.mode === 'pomodoro' && (
              <span className="mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Session #{session.sessionIndex || 1}
              </span>
            )}
          </div>
        </div>

        {/* Main Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
          {session ? (
            <>
              <button
                type="button"
                onClick={running ? focusPause : focusResume}
                className="btn-aesthetic-primary !py-3 !px-8 !text-base"
              >
                {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
                <span>{running ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                type="button"
                onClick={focusReset}
                className="btn-aesthetic-secondary !py-3 !px-4"
                title="Restart phase"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="btn-aesthetic-secondary !py-3 !px-5 text-emerald-600 hover:text-emerald-700"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Save & Finish</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="btn-aesthetic-ghost !py-3 !px-4 text-rose-500 hover:text-rose-600"
              >
                Discard
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleStart('pomodoro')}
              className="btn-aesthetic-primary !py-3.5 !px-10 !text-base"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Begin Focus Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Focus Stats Today */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-aesthetic p-4 text-center">
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {todayFocusMins}m
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Focused Today
          </p>
        </div>

        <div className="card-aesthetic p-4 text-center">
          <p className="text-2xl font-black text-amber-500">
            {state.focusSessions.filter((f) => f.date === state.lastActiveDate).length}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Sessions Completed
          </p>
        </div>

        <div className="card-aesthetic p-4 text-center">
          <p className="text-2xl font-black text-emerald-500">
            +{Math.floor(todayFocusMins * 0.2)} XP
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Focus XP Earned
          </p>
        </div>
      </div>
    </div>
  )
}
