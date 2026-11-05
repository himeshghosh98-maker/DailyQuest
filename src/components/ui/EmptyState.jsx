'use client'

import React from 'react'
import { Plus } from 'lucide-react'

export default function EmptyState({
  emoji,
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-10 sm:p-12 text-center transition-all ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-2xl shadow-xs ring-1 ring-indigo-500/20">
        {Icon ? <Icon className="h-7 w-7" /> : <span>{emoji || '✨'}</span>}
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6">
          {typeof action === 'object' && 'label' in action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 active:scale-[0.98] transition-all cursor-pointer"
            >
              {action.icon ? (
                <action.icon className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{action.label}</span>
            </button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  )
}
