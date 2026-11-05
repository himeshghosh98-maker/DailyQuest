import { fetchInitialQuestData } from '../actions/questActions'
import QuestsClient from '../../components/quests/QuestsClient'

export const metadata = {
  title: 'Daily Quests — DailyQuest',
  description: 'Conquer your daily habits, build streaks, and level up your productivity.',
}

export default async function QuestsPage() {
  const initialData = await fetchInitialQuestData()

  return <QuestsClient initialData={initialData} />
}
