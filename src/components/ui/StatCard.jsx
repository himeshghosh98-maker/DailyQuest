'use client'

import React from 'react'

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-indigo-600 dark:text-indigo-400',
  bgColor = 'bg-indigo-50 dark:bg-indigo-950/40',
  subtext,
  trend,
  trendType = 'positive', // 'positive' | 'negative' | 'neutral'
  className = '',
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/90 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {Icon && (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgColor} ${color}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <span
              className={`text-xs font-bold ${
                trendType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendType === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        {subtext && (
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}
