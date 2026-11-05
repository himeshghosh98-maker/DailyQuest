'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function AchievementsError({ error, reset }) {
  useEffect(() => {
    console.error('Achievements error:', error)
  }, [error])

  return (
    <div className="card-aesthetic flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto mt-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
        Could not load achievements
      </h2>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {error?.message || 'Failed to display trophies and badges.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="btn-aesthetic-primary mt-6 !py-2 !px-4 !text-xs"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  )
}
