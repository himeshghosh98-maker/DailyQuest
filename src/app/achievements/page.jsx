import { BADGES } from '../../utils/badges'
import AchievementsClient from '../../components/achievements/AchievementsClient'

export const metadata = {
  title: 'Achievements & Trophies — DailyQuest',
  description: 'Track and unlock achievements and trophy badges for consistency and mastery.',
}

export default async function AchievementsPage() {
  const serializableBadges = BADGES.map(({ id, emoji, name, description }) => ({
    id,
    emoji,
    name,
    description,
  }))

  return <AchievementsClient initialBadges={serializableBadges} />
}
