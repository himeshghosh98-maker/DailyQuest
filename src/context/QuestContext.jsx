import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import {
  BADGE_XP,
  BONUS_PERFECT_DAY,
  DATA_VERSION,
  DEFAULT_TASKS,
  FOCUS_SESSIONS_MAX,
  STORAGE_KEY,
} from '../constants'
import { todayStr } from '../utils/date'
import { gradeFor } from '../utils/grades'
import { currentStreak } from '../utils/stats'
import { isScheduledOn, scheduledTasks } from '../utils/schedule'
import { grantedXp, isComplete, progressOf, resultLabel, taskPct } from '../utils/tasks'
import { focusedMinutes, nextPhase, sessionXp } from '../utils/focus'
import { earnedBadgeIds, perfectDaysCount } from '../utils/badges'
import { levelProgress } from '../utils/xp'
import { loadState, saveState } from '../storage'

const QuestContext = createContext(null)

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Fully-normalized task with every scheduling/type field. */
function makeTask({ name, emoji, xp, type, target, unit, repeat, days, onceDate, timeOfDay }) {
  const t = type || 'yesno'
  return {
    id: uid(),
    name: String(name).trim(),
    emoji: emoji || '✨',
    xp: Math.round(Number(xp)) || 10,
    type: t,
    target: t === 'yesno' ? undefined : Math.max(1, Math.round(Number(target)) || 1),
    unit: t === 'count' ? String(unit || 'times').slice(0, 10) : undefined,
    progress: t === 'count' ? 0 : undefined,
    minutes: t === 'timed' ? 0 : undefined,
    timer: null,
    repeat: repeat || 'daily',
    days: Array.isArray(days) ? [...days] : undefined,
    onceDate: onceDate || undefined,
    startDate: todayStr(),
    timeOfDay: timeOfDay || 'any',
    done: false,
  }
}

function defaultSettings() {
  return {
    theme: 'light',
    notifEnabled: false,
    notifTime: '20:00',
    notifLastShown: null,
    // Focus timer
    pomodoroFocus: 25,
    pomodoroBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroPerLong: 4,
    focusAutoStart: true,
    focusSound: true,
    focusVolume: 0.6,
    focusNotif: false,
    focusWakeLock: true,
  }
}

function freshState() {
  return {
    version: DATA_VERSION,
    tasks: DEFAULT_TASKS.map(makeTask),
    totalXp: 0,
    history: [],
    focusSessions: [],
    focus: null, // active/paused focus session (see utils/focus.js)
    badges: {},
    toasts: [],
    settings: defaultSettings(),
    lastActiveDate: todayStr(),
  }
}

/**
 * New-day rollover, schedule-aware:
 * - only tasks scheduled TODAY are loaded into the day's log
 * - progress/counters/timers reset (yesterday's results live in history)
 * - a running timer's stored `start` timestamp is dropped without pay
 * - a focus session that would have run past midnight is ended; its focused
 *   minutes are attributed to the day it was STARTED in
 */
function rollOverIfNeeded(state) {
  const today = todayStr()
  if (state.lastActiveDate === today) return state

  // Close out a focus session started before midnight (yesterday's log).
  let { focus, focusSessions, totalXp, tasks } = state
  if (focus && focus.taskId && (focus.running || focus.elapsedMs > 0)) {
    const { record, xp, mins } = closeSessionParts(focus, focus.day || state.lastActiveDate)
    if (mins >= 1) {
      focusSessions = [...focusSessions, record]
      totalXp += xp
      tasks = logMinutesToTask(tasks, focus.taskId, mins)
    }
    focus = null
  }

  return {
    ...state,
    lastActiveDate: today,
    focus,
    focusSessions,
    totalXp,
    tasks: tasks.map((t) =>
      isScheduledOn(t, today)
        ? { ...t, done: false, progress: t.type === 'count' ? 0 : undefined, minutes: t.type === 'timed' ? 0 : undefined, timer: null }
        : t,
    ),
  }
}

/** Append the task's focused minutes to its daily progress (timed type). */
function logMinutesToTask(tasks, taskId, mins) {
  if (!mins) return tasks
  return tasks.map((t) =>
    t.id === taskId && t.type === 'timed'
      ? { ...t, minutes: (t.minutes || 0) + mins, timer: null }
      : t,
  )
}

/** Close out a session being replaced: {record, xp, minutes} in one pass. */
function closeSessionParts(session, date) {
  const mins = focusedMinutes(session)
  const xp = sessionXp(mins, { completed: false, pauses: session.pauses })
  return { record: makeSessionRecord(session, date, mins, false), xp, mins }
}

/** Immutable session record for the focusSessions log. */
function makeSessionRecord(session, date, mins, completed) {
  return {
    id: uid(),
    taskId: session.taskId || null,
    taskName: session.taskName || '',
    date,
    startedAt: new Date(session.startedAtReal || Date.now()).toISOString(),
    minutes: mins,
    completed: Boolean(completed),
    mode: session.mode || 'pomodoro',
    pauses: session.pauses || 0,
  }
}

function hydrate() {
  const saved = loadState()
  if (!saved) return freshState()
  const merged = {
    ...freshState(),
    ...saved,
    settings: { ...defaultSettings(), ...saved.settings },
    badges: saved.badges || {},
    toasts: [],
    focusSessions: Array.isArray(saved.focusSessions) ? saved.focusSessions : [],
    // A paused session restores as-is; a running one keeps its timestamps so
    // elapsed time stays correct after the tab was closed.
    focus: sanitizeSession(saved.focus),
  }
  return rollOverIfNeeded(merged)
}

/** Validate a persisted focus session; drop anything malformed. */
function sanitizeSession(f) {
  if (!f || typeof f !== 'object' || !f.taskId) return null
  return {
    taskId: String(f.taskId),
    taskName: String(f.taskName || ''),
    taskEmoji: String(f.taskEmoji || '✨'),
    mode: ['pomodoro', 'custom', 'stopwatch'].includes(f.mode) ? f.mode : 'pomodoro',
    phase: ['focus', 'break', 'longBreak'].includes(f.phase) ? f.phase : 'focus',
    sessionIndex: Math.max(1, Math.round(Number(f.sessionIndex)) || 1),
    customMin: Math.max(1, Math.round(Number(f.customMin)) || 25),
    startedAt: f.running ? Number(f.startedAt) || null : null,
    startedAtReal: Number(f.startedAtReal) || Date.now(),
    elapsedMs: Math.max(0, Number(f.elapsedMs) || 0),
    running: Boolean(f.running),
    pauses: Math.max(0, Math.round(Number(f.pauses)) || 0),
    day: typeof f.day === 'string' ? f.day : undefined,
  }
}

function clearTimer(task) {
  return task.type === 'timed' && task.timer
    ? { ...task, timer: null }
    : task
}

/**
 * Live XP check when a task's done/progress state is about to change:
 * remove what the task currently grants so it can be re-granted fresh.
 */
function settle(state, mapper) {
  const idx = state.tasks.findIndex(mapper.matches)
  if (idx === -1) return state
  const task = state.tasks[idx]
  const next = mapper.update(task)
  const delta = grantedXp(next) - grantedXp(task)
  const tasks = [...state.tasks]
  tasks[idx] = next
  return { ...state, tasks, totalXp: Math.max(0, state.totalXp + delta) }
}

function finishDay(state) {
  const date = todayStr()
  // Only today's scheduled tasks count — unscheduled ones are never "missed".
  const dayTasks = scheduledTasks(state.tasks, date)
  const total = dayTasks.length
  const done = dayTasks.filter(isComplete)
  // Completion % counts partial progress: average of each task's percent.
  const pct =
    total > 0 ? Math.round(dayTasks.reduce((s, t) => s + taskPct(t), 0) / total) : 0
  const perfect = total > 0 && done.length === total
  const bonusXp = perfect ? BONUS_PERFECT_DAY : 0

  const entry = {
    date,
    finishedAt: new Date().toISOString(),
    tasks: dayTasks.map((t) => ({
      name: t.name,
      emoji: t.emoji,
      xp: t.xp,
      done: isComplete(t),
      type: t.type,
      target: t.target,
      unit: t.unit,
      result: resultLabel(t),
    })),
    completedCount: done.length,
    totalCount: total,
    completionPct: pct,
    xpEarned: state.tasks.reduce((sum, t) => sum + grantedXp(t), 0),
    bonusXp,
    grade: gradeFor(pct),
    perfect,
  }

  // Re-finishing the same day updates the existing entry instead of duplicating it.
  const previous = state.history.find((h) => h.date === date)
  const history = previous
    ? state.history.map((h) => (h.date === date ? entry : h))
    : [...state.history, entry]

  // Task XP is granted live; the perfect-day bonus must be adjusted on re-finish.
  const totalXp = Math.max(0, state.totalXp - (previous?.bonusXp || 0) + bonusXp)

  return { ...state, history, totalXp }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, makeTask(action.payload)] }

    case 'UPDATE_TASK': {
      const { id, ...patch } = action.payload
      return settle(state, {
        matches: (t) => t.id === id,
        update: (t) => clearTimer({ ...t, ...patch }),
      })
    }

    case 'DELETE_TASK': {
      const task = state.tasks.find((t) => t.id === action.id)
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.id),
        totalXp: task ? Math.max(0, state.totalXp - grantedXp(task)) : state.totalXp,
      }
    }

    // Yes/No checkbox.
    case 'TOGGLE_TASK':
      return settle(state, {
        matches: (t) => t.id === action.id,
        update: (t) => ({ ...t, done: !t.done }),
      })

    // Count type: set the counter directly (stepper buttons).
    case 'SET_PROGRESS':
      return settle(state, {
        matches: (t) => t.id === action.id && t.type === 'count',
        update: (t) => ({ ...t, progress: Math.max(0, Math.round(action.value)) }),
      })

    // Timed type: set logged minutes directly (+ add minutes).
    case 'SET_MINUTES':
      return settle(state, {
        matches: (t) => t.id === action.id && t.type === 'timed',
        update: (t) => clearTimer({ ...t, minutes: Math.max(0, Math.round(action.value)) }),
      })

    // Timed type: start storing the wall-clock start timestamp.
    case 'START_TIMER':
      return settle(state, {
        matches: (t) => t.id === action.id && t.type === 'timed',
        update: (t) => (t.timer ? t : { ...t, timer: Date.now() }),
      })

    // Timed type: stop and bank the elapsed minutes from the start timestamp.
    case 'STOP_TIMER':
      return settle(state, {
        matches: (t) => t.id === action.id && t.type === 'timed',
        update: (t) =>
          t.timer
            ? { ...t, minutes: t.minutes + Math.max(0, Math.floor((Date.now() - Number(t.timer)) / 60000)), timer: null }
            : t,
      })

    /* ===== Focus timer ===== */

    // Start a fresh session for a task (replaces any existing one).
    case 'FOCUS_START': {
      const { task, mode, customMin } = action
      const prev = state.focus
      return {
        ...state,
        focus: {
          taskId: task.id,
          taskName: task.name,
          taskEmoji: task.emoji || '✨',
          mode: mode || 'pomodoro',
          phase: 'focus',
          sessionIndex: 1,
          customMin: Math.max(1, Math.round(customMin) || 25),
          startedAt: Date.now(),
          startedAtReal: Date.now(),
          elapsedMs: 0,
          running: true,
          pauses: 0,
          day: todayStr(),
        },
        // A replaced session is closed out and logged first (never lost).
        // Sessions under a minute log nothing (anti-farm).
        ...(() => {
          if (!prev) return {}
          const { record, xp, mins } = closeSessionParts(prev, prev.day || state.lastActiveDate)
          if (mins < 1) return {}
          return {
            focusSessions: [...state.focusSessions, record],
            totalXp: state.totalXp + xp,
            tasks: logMinutesToTask(state.tasks, prev.taskId, mins),
          }
        })(),
      }
    }

    case 'FOCUS_PAUSE':
      return state.focus?.running
        ? {
            ...state,
            focus: {
              ...state.focus,
              elapsedMs: state.focus.elapsedMs + (Date.now() - state.focus.startedAt),
              startedAt: null,
              running: false,
              pauses: state.focus.pauses + 1,
            },
          }
        : state

    case 'FOCUS_RESUME':
      return state.focus && !state.focus.running
        ? { ...state, focus: { ...state.focus, startedAt: Date.now(), running: true } }
        : state

    // Reset the current phase's clock (keeps the session alive).
    case 'FOCUS_RESET':
      return state.focus
        ? {
            ...state,
            focus: { ...state.focus, startedAt: state.focus.running ? Date.now() : null, elapsedMs: 0 },
          }
        : state

    /**
     * End the session: log focused minutes once (task progress + XP + record).
     * `completed` marks a session that ran to its planned end.
     */
    case 'FOCUS_FINISH': {
      const f = state.focus
      if (!f) return state
      const mins = focusedMinutes(f)
      const completed = Boolean(action.completed)
      const xp = sessionXp(mins, { completed, pauses: f.pauses })
      return {
        ...state,
        focus: null,
        // Sub-minute sessions log nothing (anti-farm), but still close.
        focusSessions:
          mins >= 1
            ? [...state.focusSessions, makeSessionRecord(f, f.day || state.lastActiveDate, mins, completed)].slice(-FOCUS_SESSIONS_MAX)
            : state.focusSessions,
        totalXp: state.totalXp + xp,
        tasks: logMinutesToTask(state.tasks, f.taskId, mins),
      }
    }

    /**
     * A phase (focus or break) ran to its planned end: advance the session.
     * Focus phases log their minutes; breaks just move the cycle forward.
     */
    case 'FOCUS_PHASE_DONE': {
      const f = state.focus
      if (!f) return state

      // Focus phase finished: bank the minutes + XP, record the session.
      // (A sub-minute "completion" is only possible via edge cases; skip the
      // record but still advance the cycle.)
      if (f.phase === 'focus') {
        const mins = focusedMinutes(f)
        const nextIndex = f.mode === 'pomodoro' ? f.sessionIndex + 1 : f.sessionIndex
        const following = nextPhase(f, state.settings.pomodoroPerLong || 4)
        const base = {
          ...state,
          focus: action.autoStart
            ? {
                ...f,
                phase: following,
                sessionIndex: nextIndex,
                startedAt: Date.now(),
                startedAtReal: Date.now(),
                elapsedMs: 0,
                running: true,
                pauses: 0,
              }
            : {
                ...f,
                phase: following,
                sessionIndex: nextIndex,
                startedAt: null,
                elapsedMs: 0,
                running: false,
                pauses: 0,
              },
        }
        if (mins < 1) return base
        const xp = sessionXp(mins, { completed: true, pauses: f.pauses })
        const record = makeSessionRecord(f, f.day || state.lastActiveDate, mins, true)
        return {
          ...base,
          focusSessions: [...state.focusSessions, record].slice(-FOCUS_SESSIONS_MAX),
          totalXp: base.totalXp + xp,
          tasks: logMinutesToTask(base.tasks, f.taskId, mins),
        }
      }

      // Break finished: back to focus (same session, next round).
      const nextIndex = f.mode === 'pomodoro' ? f.sessionIndex + 1 : f.sessionIndex
      return {
        ...state,
        focus: action.autoStart
          ? { ...f, phase: 'focus', sessionIndex: nextIndex, startedAt: Date.now(), startedAtReal: Date.now(), elapsedMs: 0, running: true, pauses: 0 }
          : { ...f, phase: 'focus', sessionIndex: nextIndex, startedAt: null, elapsedMs: 0, running: false, pauses: 0 },
      }
    }

    // Discard the session without logging (abandon).
    case 'FOCUS_CANCEL':
      return { ...state, focus: null }

    // Dev/test-only: fast-forward the running phase's elapsed time.
    case 'FOCUS_TEST_ELAPSED': {
      if (import.meta.env?.DEV && state.focus) {
        const addMs = Math.round(action.ms || 0)
        return {
          ...state,
          focus: {
            ...state.focus,
            startedAt: state.focus.running ? Date.now() - addMs - state.focus.elapsedMs : null,
            elapsedMs: state.focus.elapsedMs + addMs,
          },
        }
      }
      return state
    }

    case 'ROLLOVER_DAY':
      return rollOverIfNeeded(state)

    case 'FINISH_DAY':
      return finishDay(state)

    case 'AWARD_BADGES': {
      // Idempotent: ignore ids already earned (guards against StrictMode
      // double-invoked effects or duplicate evaluations).
      const newIds = (action.ids || []).filter((id) => !state.badges?.[id])
      if (newIds.length === 0) return state
      const badges = { ...state.badges }
      newIds.forEach((id) => {
        badges[id] = new Date().toISOString()
      })
      return {
        ...state,
        badges,
        toasts: [...state.toasts.filter((id) => !newIds.includes(id)), ...newIds],
        totalXp: state.totalXp + newIds.length * BADGE_XP,
      }
    }

    case 'DISMISS_BADGE_TOAST':
      return { ...state, toasts: state.toasts.filter((id) => id !== action.id) }

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case 'IMPORT': {
      // Recompute badges silently from the imported data (no toast spam).
      const imported = rollOverIfNeeded({
        ...action.state,
        settings: { ...defaultSettings(), ...action.state.settings },
      })
      const helpers = {
        streak: currentStreak(imported.history, imported.lastActiveDate),
        level: levelProgress(imported.totalXp).level,
        perfectDays: perfectDaysCount(imported.history),
      }
      const badges = {}
      earnedBadgeIds(imported, helpers).forEach((id) => {
        badges[id] = imported.badges?.[id] || new Date().toISOString()
      })
      return { ...imported, badges, toasts: [] }
    }

    case 'RESET':
      return freshState()

    default:
      return state
  }
}

export function QuestProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, hydrate)

  // Persist on every change.
  useEffect(() => {
    saveState(state)
  }, [state])

  // Auto-reset quests at midnight even if the tab stays open.
  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'ROLLOVER_DAY' }), 30_000)
    return () => clearInterval(timer)
  }, [])

  // Apply the theme class to <html>.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark')
  }, [state.settings.theme])

  const value = useMemo(
    () => ({
      state,
      addTask: (payload) => dispatch({ type: 'ADD_TASK', payload }),
      updateTask: (payload) => dispatch({ type: 'UPDATE_TASK', payload }),
      deleteTask: (id) => dispatch({ type: 'DELETE_TASK', id }),
      toggleTask: (id) => dispatch({ type: 'TOGGLE_TASK', id }),
      setProgress: (id, value) => dispatch({ type: 'SET_PROGRESS', id, value }),
      setMinutes: (id, value) => dispatch({ type: 'SET_MINUTES', id, value }),
      startTimer: (id) => dispatch({ type: 'START_TIMER', id }),
      stopTimer: (id) => dispatch({ type: 'STOP_TIMER', id }),
      finishDay: () => dispatch({ type: 'FINISH_DAY' }),
      focusStart: (task, mode, customMin) => dispatch({ type: 'FOCUS_START', task, mode, customMin }),
      focusPause: () => dispatch({ type: 'FOCUS_PAUSE' }),
      focusResume: () => dispatch({ type: 'FOCUS_RESUME' }),
      focusReset: () => dispatch({ type: 'FOCUS_RESET' }),
      focusFinish: (completed) => dispatch({ type: 'FOCUS_FINISH', completed }),
      focusPhaseDone: (autoStart) => dispatch({ type: 'FOCUS_PHASE_DONE', autoStart }),
      focusCancel: () => dispatch({ type: 'FOCUS_CANCEL' }),
      awardBadges: (ids) => dispatch({ type: 'AWARD_BADGES', ids }),
      dismissBadgeToast: (id) => dispatch({ type: 'DISMISS_BADGE_TOAST', id }),
      setSettings: (payload) => dispatch({ type: 'SET_SETTINGS', payload }),
      markCelebrated: (date) =>
        dispatch({ type: 'SET_SETTINGS', payload: { celebratedDate: date } }),
      importData: (nextState) => dispatch({ type: 'IMPORT', state: nextState }),
      resetAll: () => dispatch({ type: 'RESET' }),
    }),
    [state],
  )

  // Dev-only handle for driving actions from tests (stripped in prod builds).
  // __dqState is the live state object; readers use its .value at call time.
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    window.__dqDispatch = dispatch
    window.__dqGetState = () => state
  }

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>
}

export function useQuest() {
  const ctx = useContext(QuestContext)
  if (!ctx) throw new Error('useQuest must be used inside <QuestProvider>')
  return ctx
}
