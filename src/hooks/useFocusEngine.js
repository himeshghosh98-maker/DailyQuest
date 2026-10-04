import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuest } from '../context/QuestContext'
import { elapsedMs, phaseComplete, phaseLabel, remainingMs } from '../utils/focus'
import { notifyFocus, playChime, requestWakeLock, vibrate } from '../utils/alerts'

/** Compact mm:ss (or h:mm:ss) title prefix. */
function fmtTitle(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const core = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return h > 0 ? `${h}:${core}` : core
}

/**
 * Owns the live side of the focus session:
 * - re-renders ~4x/s from Date.now() (time is always derived from stored
 *   timestamps, never a counter — refresh/tab-switch/sleep cannot drift it)
 * - fires FOCUS_PHASE_DONE exactly once when a countdown reaches zero
 * - chime + vibration + in-app toast + browser notification on completion
 * - holds a Screen Wake Lock while running (when enabled in Settings)
 * - updates document.title with the remaining time
 */
export default function useFocusEngine() {
  const { state, focusPhaseDone } = useQuest()
  const session = state.focus
  const running = Boolean(session?.running)

  const [now, setNow] = useState(() => Date.now())
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const phaseDoneFired = useRef(false)
  const toastTimer = useRef(null)

  // New session (or new phase) re-arms the one-shot completion guard.
  useEffect(() => {
    phaseDoneFired.current = false
  }, [session?.taskId, session?.phase, session?.sessionIndex, session === null])

  const settings = {
    autoStart: Boolean(state.settings.focusAutoStart),
    sound: state.settings.focusSound !== false,
    volume: state.settings.focusVolume ?? 0.6,
    notify: Boolean(state.settings.focusNotif),
  }

  const handlePhaseComplete = useCallback(
    (sess) => {
      if (phaseDoneFired.current) return
      phaseDoneFired.current = true

      const finishedFocus = sess.phase === 'focus'
      const msg = finishedFocus
        ? 'Focus session complete — logged! 🎉'
        : `${phaseLabel(sess.phase)} over — back to it!`

      if (settings.sound) playChime(settings.volume, finishedFocus)
      vibrate()
      if (settings.notify) notifyFocus('DailyQuest', msg)

      setToast(msg)
      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(null), 4500)

      focusPhaseDone(settings.autoStart)
    },
    [focusPhaseDone, settings.autoStart, settings.sound, settings.volume, settings.notify],
  )

  // Ticker at 4 Hz while a session exists.
  useEffect(() => {
    if (!session) return undefined
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [session !== null, session?.phase, session?.sessionIndex])

  // Completion check on every tick.
  useEffect(() => {
    if (session && phaseComplete(session, now)) handlePhaseComplete(session)
  }, [session, now, handlePhaseComplete])

  // Catch up instantly when the tab becomes visible again.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      setNow(Date.now())
      if (session && phaseComplete(session, Date.now())) handlePhaseComplete(session)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [session, handlePhaseComplete])

  // Document title shows remaining (countdown) or elapsed (stopwatch) time.
  useEffect(() => {
    if (!session) {
      document.title = 'DailyQuest'
      return undefined
    }
    const ms = session.mode === 'stopwatch' ? elapsedMs(session, now) : remainingMs(session, now)
    document.title = `${fmtTitle(ms)} · ${session.taskName}`
    return () => {
      document.title = 'DailyQuest'
    }
  }, [session, now])

  // Screen Wake Lock while running (when enabled).
  useEffect(() => {
    if (!running || !state.settings.focusWakeLock) return undefined
    let cancelled = false
    let lock = null
    requestWakeLock().then((l) => {
      if (!cancelled) lock = l
    })
    const reacquire = () => {
      if (document.visibilityState !== 'visible') return
      requestWakeLock().then((l) => {
        if (!cancelled) lock = l
      })
    }
    document.addEventListener('visibilitychange', reacquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', reacquire)
      try {
        lock?.release?.()
      } catch {
        /* already released */
      }
    }
  }, [running, state.settings.focusWakeLock])

  return { session, running, now, open, setOpen, toast, remaining: session ? remainingMs(session, now) : 0, elapsed: session ? elapsedMs(session, now) : 0 }
}
