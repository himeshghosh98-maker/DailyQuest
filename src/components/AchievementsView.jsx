'use client'

import { useState, useMemo } from 'react'
import { Trophy, Sparkles, Award, CheckCircle2, Lock } from 'lucide-react'
import { BADGES } from '../utils/badges'
import { useQuest } from '../context/QuestContext'
import { BADGE_XP } from '../constants'
import PageHeader from './ui/PageHeader'
import StatCard from './ui/StatCard'
import Badge from './ui/Badge'
import EmptyState from './ui/EmptyState'

export default function AchievementsView() {
  const { state } = useQuest()
  const [filter, setFilter] = useState('all') // 'all', 'unlocked', 'locked'

  const earned = state.badges || {}
  const earnedCount = Object.keys(earned).length
  const totalBadges = BADGES.length
  const completionPct = Math.round((earnedCount / totalBadges) * 100)

  const filteredBadges = useMemo(() => {
    return BADGES.filter((b) => {
      const isUnlocked = Boolean(earned[b.id])
      if (filter === 'unlocked') return isUnlocked
      if (filter === 'locked') return !isUnlocked
      return true
    })
  }, [earned, filter])

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Eyebrow and Filter Tabs */}
      <PageHeader
        eyebrow="Progression / Achievements"
        title="Achievements & Trophies"
        description={`Unlock badges to prove your discipline and earn +${BADGE_XP} bonus XP for each achievement.`}
        badge={
          <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {earnedCount} of {totalBadges} Unlocked
            </span>
          </span>
        }
        action={
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All ({totalBadges})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unlocked')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'unlocked'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Unlocked ({earnedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('locked')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'locked'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Locked ({totalBadges - earnedCount})
            </button>
          </div>
        }
      />

      {/* 2. Top KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Badges Unlocked"
          value={`${earnedCount}/${totalBadges}`}
          icon={Trophy}
          color="text-amber-500"
          bgColor="bg-amber-50 dark:bg-amber-950/40"
          subtext="Proven milestones"
          trend={`${completionPct}%`}
          trendType={completionPct > 50 ? 'positive' : 'neutral'}
        />
        <StatCard
          label="Bonus XP Earned"
          value={`+${(earnedCount * BADGE_XP).toLocaleString()}`}
          icon={Sparkles}
          color="text-indigo-600"
          bgColor="bg-indigo-50 dark:bg-indigo-950/40"
          subtext={`+${BADGE_XP} XP per badge`}
          trend="Rewards"
          trendType="positive"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionPct}%`}
          icon={CheckCircle2}
          color="text-emerald-500"
          bgColor="bg-emerald-50 dark:bg-emerald-950/40"
          subtext="Overall trophy progress"
          trend={completionPct === 100 ? 'Master' : 'In Progress'}
          trendType={completionPct === 100 ? 'positive' : 'neutral'}
        />
        <StatCard
          label="Badges Remaining"
          value={totalBadges - earnedCount}
          icon={Award}
          color="text-violet-600"
          bgColor="bg-violet-50 dark:bg-violet-950/40"
          subtext="Available to unlock"
          trend={`${totalBadges - earnedCount} Left`}
          trendType="neutral"
        />
      </div>

      {/* 3. Grid of Badges or Empty State */}
      {filteredBadges.length === 0 ? (
        <EmptyState
          emoji="🏆"
          title="No badges match this filter"
          description="Keep conquering your daily quests to earn new achievement badges and XP rewards."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => (
            <Badge
              key={badge.id}
              badge={badge}
              unlocked={Boolean(earned[badge.id])}
              unlockedAt={earned[badge.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
