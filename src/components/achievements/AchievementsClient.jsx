'use client'

import { BADGES } from '../../utils/badges'
import { useQuest } from '../../context/QuestContext'
import { BADGE_XP } from '../../constants'
import PageHeader from '../ui/PageHeader'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { Sparkles } from 'lucide-react'

export default function AchievementsClient({ initialBadges = BADGES }) {
  const { state } = useQuest()
  const earned = state?.badges || {}
  const badgesList = initialBadges || BADGES
  const earnedCount = Object.keys(earned).length

  return (
    <div className="space-y-6">
      {/* Title & Progress Header */}
      <PageHeader
        title="Achievements & Trophies"
        description={`Unlock badges to prove your discipline and earn +${BADGE_XP} bonus XP for each achievement.`}
        badge={
          <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {earnedCount} of {badgesList.length} Unlocked
            </span>
          </span>
        }
      />

      {/* Grid of Badges or Empty State */}
      {badgesList.length === 0 ? (
        <EmptyState
          emoji="🏆"
          title="No achievements defined"
          description="Achievements will appear here as you level up and complete quests."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badgesList.map((badge) => (
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
