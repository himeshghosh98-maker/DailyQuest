import { Skeleton } from '../../components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* PageHeader Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Settings Cards Skeleton */}
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900/90 shadow-xs"
          >
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
