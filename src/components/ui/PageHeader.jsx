'use client'

import React from 'react'

export default function PageHeader({
  eyebrow,
  breadcrumb,
  title,
  description,
  badge,
  action,
  children,
  className = '',
}) {
  const displayEyebrow = eyebrow || breadcrumb

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-slate-800/80 mb-6 ${className}`}>
      <div className="space-y-1">
        {displayEyebrow && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {displayEyebrow}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-500/20 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-500/30">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(action || children) && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {action}
          {children}
        </div>
      )}
    </div>
  )
}
