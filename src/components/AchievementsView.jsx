'use client'

import { Trophy, Sparkles, CheckCircle2, Lock, Flame } from 'lucide-react'
import { BADGES } from '../utils/badges'
import { useQuest } from '../context/QuestContext'
import { BADGE_XP } from '../constants'

export default function AchievementsView() {
  const { state } = useQuest()
  const earned = state.badges || {}
  const earnedCount = Object.keys(earned).length

  return (
    <div className="space-y-6">
      {/* Title & Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Trophy className="h-7 w-7 text-amber-500" />
            <span>Achievements & Trophies</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Unlock badges to prove your discipline and earn +{BADGE_XP} bonus XP for each achievement.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-amber-50 px-4 py-2 border border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-800/80">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-black text-amber-800 dark:text-amber-200">
            {earnedCount} of {BADGES.length} Unlocked
          </span>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BADGES.map((badge) => {
          const has = Boolean(earned[badge.id])
          const unlockedAt = earned[badge.id]

          return (
            <div
              key={badge.id}
              className={`card-aesthetic p-5 relative overflow-hidden transition-all duration-200 ${
                has
                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900'
                  : 'opacity-70 dark:opacity-60 grayscale-[40%]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Emoji Avatar */}
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm ${
                    has
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 ring-2 ring-amber-400/50'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700'
                  }`}
                >
                  {has ? badge.emoji : '🔒'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {badge.name}
                    </h3>
                    {has ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {badge.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="badge-pill bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      +{BADGE_XP} XP Reward
                    </span>
                    {has && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Earned!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
