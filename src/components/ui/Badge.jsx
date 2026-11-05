'use client'

import { CheckCircle2, Lock } from 'lucide-react'
import { BADGE_XP } from '../../constants'

export default function Badge({ badge, unlocked, unlockedAt, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card-aesthetic p-5 relative overflow-hidden transition-all duration-200 ${
        unlocked
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 shadow-sm'
          : 'opacity-70 dark:opacity-60 grayscale-[40%]'
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Emoji Avatar */}
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm ${
            unlocked
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 ring-2 ring-amber-400/50'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700'
          }`}
        >
          {unlocked ? badge.emoji : '🔒'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {badge.name}
            </h3>
            {unlocked ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {badge.description}
          </p>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="badge-pill bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              +{BADGE_XP} XP Reward
            </span>
            {unlocked && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Earned!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
