'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({
  title = 'Something went wrong',
  description = 'Failed to load this view. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-rose-200/80 bg-rose-50/50 p-8 sm:p-10 text-center dark:border-rose-900/40 dark:bg-rose-950/20 ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1.5 max-w-sm mx-auto text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>

      {onRetry && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  )
}
