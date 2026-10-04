import { Timer as TimerIcon } from 'lucide-react'
import { fmtClock, remainingMs } from '../utils/focus'

/**
 * Small floating pill (above the FAB) showing the live focus countdown.
 * Tap to reopen the focus view. Hidden when the focus view is open.
 */
export default function MiniTimer({ session, remaining, onOpen, hidden }) {
  if (!session || hidden) return null
  const focusPhase = session.phase === 'focus'
  const label =
    session.mode === 'stopwatch'
      ? fmtClock(remaining)
      : fmtClock(remainingMs(session, Date.now()))

  return (
    <button
      onClick={onOpen}
      data-slot="mini-timer"
      className="app-fixed absolute bottom-[176px] right-5 z-40 flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-white shadow-xl shadow-charcoal/40 transition-transform active:scale-95"
      aria-label={`Reopen focus timer for ${session.taskName}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15" aria-hidden>
        <TimerIcon size={13} />
      </span>
      <span className="text-[13px] font-extrabold tabular-nums">{label}</span>
      <span className="max-w-[72px] truncate text-[12px] font-semibold text-white/70">
        {focusPhase ? session.taskName : 'Break'}
      </span>
      {!session.running && (
        <span className="h-1.5 w-1.5 rounded-full bg-peach" aria-label="Paused" />
      )}
    </button>
  )
}
