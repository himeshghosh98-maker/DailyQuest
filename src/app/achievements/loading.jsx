import { Skeleton, SkeletonKPI } from '../../components/ui/Skeleton'

export default function AchievementsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* PageHeader Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 rounded-md" />
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>

      {/* Badges grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900/90 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-3 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
