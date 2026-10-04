import { useState } from 'react'
import { Pause, Play, RotateCcw, Square } from 'lucide-react'
import Modal from './ui/Modal'
import Confetti from './ui/Confetti'
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

const MODE_LABELS = { pomodoro: 'Pomodoro', custom: 'Custom', stopwatch: 'Stopwatch' }
const R = 120
const CIRC = 2 * Math.PI * R

/**
 * Full-screen focus session view (inside the phone): task header, mode
 * switcher (before start / on stop), the big ring with remaining time,
 * Start/Pause + Reset + Finish controls, and the session count.
 */
export default function FocusView({ engine }) {
  const { session, running, now, open, setOpen, toast } = engine
  const { state, focusStart, focusPause, focusResume, focusReset, focusFinish, focusCancel } =
    useQuest()

  const [mode, setMode] = useState(session?.mode || 'pomodoro')
  const [customMin, setCustomMin] = useState(session?.customMin || 25)

  if (!session) return null

  const remaining = session.mode === 'stopwatch' ? elapsedMs(session, now) : remainingMs(session, now)
  const frac = ringFraction(session, now)
  const total = durationMs(session, session.phase, state.settings)
  const minsFocused = focusedMinutes(session, now)

  function startNew(m, min) {
    const task = state.tasks.find((t) => t.id === session.taskId) || {
      id: session.taskId,
      name: session.taskName,
      emoji: session.taskEmoji,
    }
    focusStart(task, m, min)
  }

  function finish() {
    // "Finish" = stop early: log what was focused, close the view.
    focusFinish(false)
    setOpen(false)
  }

  function cancel() {
    if (minsFocused >= 1 && !window.confirm(`Discard this session? ${minsFocused} min focused will NOT be logged.`)) return
    focusCancel()
    setOpen(false)
  }

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="focus-title">
        <div className="text-center">
          {/* Task header */}
          <p id="focus-title" className="text-xs font-extrabold uppercase tracking-wide text-tangerine">
            {MODE_LABELS[session.mode]} · {phaseLabel(session.phase)}
          </p>
          <h3 className="mt-1 flex items-center justify-center gap-2 text-xl font-extrabold text-charcoal dark:text-parchment">
            <span aria-hidden>{session.taskEmoji}</span>
            <span className="truncate">{session.taskName}</span>
          </h3>

          {/* Mode switcher (switching closes the current session) */}
          <div className="mx-auto mt-3 flex w-fit gap-1.5 rounded-full bg-cream p-1.5 dark:bg-white/5">
            {FOCUS_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  startNew(m, m === 'custom' ? customMin : undefined)
                }}
                aria-pressed={session.mode === m}
                className={`min-h-[38px] rounded-full px-3.5 text-[13px] font-bold transition-all ${
                  session.mode === m
                    ? 'bg-cocoa text-white'
                    : 'text-ink-soft hover:text-ink dark:text-taupe dark:hover:text-parchment'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Custom durations */}
          {session.mode === 'custom' && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {CUSTOM_DURATIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCustomMin(m)
                    startNew('custom', m)
                  }}
                  aria-pressed={session.customMin === m}
                  className={`min-h-[36px] rounded-full px-3 text-[13px] font-bold transition-all ${
                    session.customMin === m
                      ? 'bg-tangerine text-white'
                      : 'bg-cream text-ink-soft hover:text-ink dark:bg-white/5 dark:text-taupe'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          {/* The big ring */}
          <div className="relative mx-auto mt-5 flex h-[264px] w-[264px] items-center justify-center">
            <svg viewBox="0 0 264 264" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="132" cy="132" r={R} fill="none" strokeWidth="14" className="stroke-linen dark:stroke-white/10" />
              <circle
                cx="132"
                cy="132"
                r={R}
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                className={
                  session.phase === 'focus'
                    ? 'stroke-tangerine'
                    : 'stroke-olive'
                }
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - frac)}
                style={{ transition: 'stroke-dashoffset 0.3s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {session.mode === 'stopwatch' ? (
                <span className="text-5xl font-extrabold tabular-nums text-charcoal dark:text-parchment">
                  {fmtClock(remaining)}
                </span>
              ) : (
                <span
                  className={`text-5xl font-extrabold tabular-nums ${
                    session.phase === 'focus' ? 'text-charcoal dark:text-parchment' : 'text-olive-deep dark:text-mint'
                  }`}
                >
                  {fmtClock(remaining)}
                </span>
              )}
              <span className="mt-1 text-[13px] font-bold text-ink-soft">
                {session.mode === 'stopwatch'
                  ? `${minsFocused} min focused`
                  : session.phase === 'focus'
                    ? `${minsFocused} min focused`
                    : 'Rest up'}
              </span>
              {running ? (
                <span className="mt-0.5 flex items-center gap-1.5 text-xs font-extrabold text-tangerine">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tangerine" aria-hidden />
                  Running
                </span>
              ) : (
                <span className="mt-0.5 text-xs font-bold text-ink-soft">Paused</span>
              )}
            </div>
          </div>

          {/* Session count (pomodoro only) */}
          {session.mode === 'pomodoro' && (
            <p className="mt-2 text-[13px] font-bold text-ink-soft">
              Session {session.sessionIndex} of {state.settings.pomodoroPerLong || 4} · next:{' '}
              {session.phase === 'focus' ? 'break' : 'focus'}
            </p>
          )}

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => focusReset()}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-linen bg-white text-ink transition active:scale-90 dark:border-white/10 dark:bg-white/5 dark:text-parchment"
              aria-label="Reset current phase"
              title="Reset phase"
            >
              <RotateCcw size={19} aria-hidden />
            </button>

            {running ? (
              <button
                onClick={focusPause}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-cocoa text-white shadow-xl shadow-cocoa/40 transition active:scale-90"
                aria-label="Pause focus timer"
              >
                <Pause size={30} aria-hidden />
              </button>
            ) : (
              <button
                onClick={focusResume}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-tangerine text-white shadow-xl shadow-tangerine/40 transition active:scale-90"
                aria-label="Start or resume focus timer"
              >
                <Play size={30} aria-hidden />
              </button>
            )}

            <button
              onClick={finish}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-linen bg-white text-ink transition active:scale-90 dark:border-white/10 dark:bg-white/5 dark:text-parchment"
              aria-label="Finish and log session"
              title="Finish & log"
            >
              <Square size={18} aria-hidden />
            </button>
          </div>

          <p className="mt-3 text-xs font-medium text-ink-soft">
            {minsFocused >= 1
              ? `${minsFocused} min will be logged for this task${session.pauses ? ` · ${session.pauses} pause${session.pauses === 1 ? '' : 's'}` : ''}`
              : 'Under 1 minute — nothing logged yet'}
          </p>
          <button className="mt-3 text-xs font-bold text-ink-soft underline-offset-2 hover:underline" onClick={cancel}>
            Discard session
          </button>
        </div>
      </Modal>

      {/* Completion toast (in-app, above the modal) */}
      {toast && (
        <div className="app-fixed fixed left-1/2 top-16 z-[80] -translate-x-1/2" data-slot="focus-toast" role="status">
          <div className="animate-rise rounded-full bg-cocoa px-5 py-2.5 text-[13px] font-bold text-white shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </>
  )
}
