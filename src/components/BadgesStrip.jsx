import { BADGES } from '../utils/badges'
import { useQuest } from '../context/QuestContext'

const TILE_BG = ['bg-peach', 'bg-mint', 'bg-blush']

/** Compact strip of all achievements; earned ones glow, locked ones are faded. */
export default function BadgesStrip() {
  const { state } = useQuest()
  const earned = state.badges || {}
  const earnedCount = Object.keys(earned).length

  return (
    <section aria-label="Achievements" className="card mt-6 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-charcoal dark:text-parchment">
          🏅 Achievements
        </h2>
        <span className="chip bg-peach text-cocoa dark:bg-peach/25 dark:text-parchment">
          {earnedCount}/{BADGES.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {BADGES.map((badge, i) => {
          const has = Boolean(earned[badge.id])
          return (
            <div
              key={badge.id}
              title={`${badge.name} — ${badge.description}${has ? '' : ' (locked)'}`}
              className={`flex w-[78px] flex-col items-center gap-1.5 rounded-2xl p-2.5 text-center transition-all ${
                has
                  ? `shadow-[0_10px_20px_-10px_rgba(249,115,22,0.55)] ${TILE_BG[i % 3]}`
                  : 'border border-dashed border-linen opacity-45 grayscale dark:border-white/10'
              }`}
            >
              <span className={`text-2xl ${has ? 'animate-flame' : ''}`} aria-hidden>
                {has ? badge.emoji : '🔒'}
              </span>
              <span className="text-[11px] font-bold leading-tight text-charcoal dark:text-parchment">
                {badge.name}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
