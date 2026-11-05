'use client'

import React from 'react'

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/60 ${className}`}
      {...props}
    />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900/90 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

export function SkeletonKPI({ className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900/90 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20 rounded-md" />
      <Skeleton className="h-3 w-32 rounded-md" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-5 space-y-4 dark:border-slate-800 dark:bg-slate-900/90 shadow-xs ${className}`}
    >
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 w-1/3">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}
