import { levelProgress } from '../utils/xp'
import { useQuest } from '../context/QuestContext'

/** Compact level/XP card in the Home header area. */
export default function TopBar() {
  const { state } = useQuest()
  const { level, current, needed, pct } = levelProgress(state.totalXp)

  return (
    <div className="card flex items-center gap-3.5 p-4">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-cocoa text-white shadow-md shadow-cocoa/30">
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Lv</span>
        <span className="-mt-0.5 text-xl font-extrabold leading-none">{level}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-bold text-ink dark:text-parchment">
            Total XP{' '}
            <span className="text-tangerine">{state.totalXp.toLocaleString()}</span>
          </p>
          <p className="shrink-0 text-xs font-medium text-ink-soft">
            {needed - current} XP to Lv {level + 1}
          </p>
        </div>
        <div
          className="mt-2 h-3 overflow-hidden rounded-full bg-linen dark:bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level progress: ${pct}%`}
        >
          <div
            className="h-full rounded-full bg-tangerine transition-all duration-700 ease-out"
            style={{ width: `${Math.max(pct, 3)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
