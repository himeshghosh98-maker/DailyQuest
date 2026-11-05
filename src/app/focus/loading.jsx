import { Skeleton } from '../../components/ui/Skeleton'

export default function FocusLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
      {/* PageHeader Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 rounded-md" />
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Main Focus Chamber Skeleton */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 sm:p-12 space-y-6 flex flex-col items-center dark:border-slate-800 dark:bg-slate-900/90 shadow-xs">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-64 w-64 rounded-full" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
