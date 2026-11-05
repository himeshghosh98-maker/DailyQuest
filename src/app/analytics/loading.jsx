import { Skeleton, SkeletonKPI, SkeletonTable } from '../../components/ui/Skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* PageHeader Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 rounded-md" />
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>

      {/* Heatmap & Chart Skeletons */}
      <div className="h-64 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-4">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>

      <div className="h-80 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-8 w-60 rounded-xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={5} />
    </div>
  )
}
