'use client'

import { useEffect } from 'react'
import { useQuest } from '../context/QuestContext'
import { badgeById } from '../utils/badges'
import { Sparkles, X } from 'lucide-react'

function ToastItem({ badge, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="animate-pop pointer-events-auto flex w-84 items-center gap-3.5 rounded-2xl border border-amber-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-amber-800/80 dark:bg-slate-900/95"
      role="status"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl dark:bg-amber-950/80 shadow-inner">
        {badge.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Sparkles className="h-3 w-3" />
          Achievement Unlocked!
        </p>
        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
          {badge.name}
        </p>
        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
          {badge.description}
        </p>
      </div>
      <button
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
        onClick={onDismiss}
        aria-label="Dismiss toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function BadgeToasts() {
  const { state, dismissBadgeToast } = useQuest()
  if (!state.toasts?.length) return null

  return (
    <div
      className="fixed right-4 top-20 z-50 flex flex-col gap-2.5 pointer-events-none"
      data-slot="toasts"
    >
      {state.toasts.map((id) => {
        const badge = badgeById(id)
        if (!badge) return null
        return (
          <ToastItem
            key={id}
            badge={badge}
            onDismiss={() => dismissBadgeToast(id)}
          />
        )
      })}
    </div>
  )
}
